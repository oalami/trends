jQuery(function($) {

    var URL = 'https://trends.firebaseio.com/'
        tagsRef = new Firebase(URL + 'tags'),
        trendsRef = new Firebase(URL + 'trends');

    /*
        Make an object of trends with their tags
        {
            "trend-name": [ 'tag1', 'tag2' ],
            "want-moar-sql": [ 'sql', 'common' ]
        }
     */
    function getTrendData(onComplete) {
        var allTheTags = {};

        // grab the tagsRef
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

            getTrends(allTheTags, onComplete);
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
    function getTrends(allTheTags, onComplete) {
        var allTheTrends = {};
        trendsRef.on('value', function(snap) {

            snap.forEach(function(ss) {
                var trendObject = ss.val();
                var trendName = ss.name();

                trendObject.tags = allTheTags[trendName]||[];

                allTheTrends[trendName] = trendObject;

            });

            if(onComplete) {
                onComplete.call(this, allTheTrends);
            }

        });
    }

    function makeRow(trend) {
        var row = '';
        row += '<tr>';
        row += makeDef(trend.summary);
        row += makeDef(trend.tags.join(','));
        row += makeDef(trend.count);
        row += '</tr>'
        return row;
    }

    function makeDef(val) {
        return '<td>' + val + '</td>';
    }

    getTrendData(function renderPage(trends) {
        var rows = [];
        Object.keys(trends).forEach(function(trend) {
            rows.push(makeRow(trends[trend]));
        });
        var $tbody = $('#tbody'),
            $table = $tbody.parent();

        $tbody.html(rows.join(''));

        $table.dataTable();
    });

});