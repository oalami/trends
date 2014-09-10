(function(window, Trends, Firebase) {

    /*
     Make an object of trends with their tags
     {
        "trend-name": [ 'tag1', 'tag2' ],
        "want-moar-sql": [ 'sql', 'common' ]
     }
     */
    var getTrendData = function getTrendData(onComplete) {
        var allTheTags = {};
        var tagsRef = new Firebase('https://' + window.instance + '.firebaseio.com/tags');

        // grab the tags
        tagsRef.on('value', function(snap) {
            // loop through each tag to get the trend keys
            snap.forEach(function(snapTag) {
                var tagKey = snapTag.name();

                snapTag.forEach(function (snapTrend) {
                    var trendKey = snapTrend.name();

                    if( !allTheTags[trendKey] ) {
                        allTheTags[trendKey] = [];
                    }

                    allTheTags[trendKey].push(tagKey);
                });

            });

            // get the trends reference
            var trendsRef = tagsRef.root().child('trends');

            getTrends(trendsRef, allTheTags, onComplete);
        });
    }


    /*
     Make an object of trends and their info while joining on the tags
     {
        "trend-name":  {
            "count": 3,
            "tags": [ 'tag1', 'tag2' ],
            ...
        }
     }
     */
     function getTrends(trendsRef, allTheTags, onComplete) {

        trendsRef.on('value', function(snap) {

            resolve(allTheTags, snap).then(function(allTheTrends) {

                if(onComplete) {
                    onComplete.call(this, allTheTrends);
                }

            });

        });

    }

    function resolve (allTheTags, snap) {
        var snapPromise = $.Deferred(),
            allTheTrends = {};

        snap.forEach(function(ss) {
            var trendObject = ss.val();
            var trendName = ss.name();
            var trendPromise = $.Deferred();

            trendObject.tags = allTheTags[trendName]||[];
            allTheTrends[trendName] = trendObject;

        });

        snapPromise.resolve(allTheTrends);

        return snapPromise.promise();
    }

    function getTrendEntries(id) {

    }

    Trends.Data = {
        getTrendData: getTrendData,
        getTrendEntries: getTrendEntries
    };

}(window, window.Trends, window.Firebase));