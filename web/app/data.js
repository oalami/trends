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
        tagsRef.once('value', function(snap) {
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
        var allTheTrends = {};

        trendsRef.on('value', function(snap) {

            snap.forEach(function(ss) {
                var trendObject = ss.val();
                var trendName = ss.name();

                trendObject.tags = allTheTags[trendName]||[];
                allTheTrends[trendName] = trendObject;
                allTheTrends[trendName].id = trendName;

            });

            if (onComplete) {
                onComplete.call(this, allTheTrends);
            }
        });

    }

    function getLatest(ref, trends, onComplete) {

        Object.keys(trends).forEach(function(trendName) {

            ref.child(trendName).limit(1).once('value', function(snap) {

                snap.forEach(function(ss) {
                    trends[trendName].last = ss.val().timestamp;
                });

            });

        });

    }

    function getTrendEntries(id) {
        var defer = $.Deferred();
        var entryRef = new Firebase('https://' + window.instance + '.firebaseio.com/entries');

        entryRef.child(id).once('value', function(snap) {
            defer.resolve(snap.val());
        });

        return defer.promise();
    }

    Trends.Data = {
        getTrendData: getTrendData,
        getTrendEntries: getTrendEntries
    };

}(window, window.Trends, window.Firebase));
