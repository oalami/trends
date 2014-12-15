(function(angular, config) {
  "use strict";

  var app = config.app();

  app.factory('Tags', function($FirebaseArray, $firebase, TrendsRef, $timeout) {

    function getTrends(trendsRef, allTheTags, onComplete) {
      var allTheTrends = {};

      trendsRef.on('value', function(snap) {

        snap.forEach(function(ss) {
          var trendObject = ss.val();
          var trendName = ss.key();

          trendObject.tags = allTheTags[trendName]||[];
          allTheTrends[trendName] = trendObject;
          allTheTrends[trendName].id = trendName;

        });

        if (onComplete) {
          $timeout(function() {
            onComplete.call(this, allTheTrends);
          });
        }

      });

    }

    var TagsFactory = $FirebaseArray.$extendFactory({
      getTrends: function(params) {
        var allTheTags = [];
        angular.forEach(this.$list, function(tag) {
          // $id
          var tagId = tag.$id;
          angular.forEach(tag, function(value, key) {
            if(key.indexOf('$') === 0) { return; } // no $ props

            if(!allTheTags[key]) {
              allTheTags[key] = [];
            }

            allTheTags[key].push(tagId);

          });

          getTrends(TrendsRef, allTheTags, params.onComplete);

        });
      }
    });

    return function(listRef) {
      var sync = $firebase(listRef, {arrayFactory: TagsFactory});
      return sync.$asArray();
    }
  });

}(angular, config));
