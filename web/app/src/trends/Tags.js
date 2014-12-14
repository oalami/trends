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
      getTrends: function(onComplete) {
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

          getTrends(TrendsRef, allTheTags, onComplete);

        });
      }
    });

    return function(listRef) {
      var sync = $firebase(listRef, {arrayFactory: TagsFactory});
      return sync.$asArray();
    }
  });

  // loop through each tag to get the trend keys
  // snap.forEach(function(snapTag) {
  //   var tagKey = snapTag.name();
  //
  //   snapTag.forEach(function (snapTrend) {
  //     var trendKey = snapTrend.name();
  //
  //     if( !allTheTags[trendKey] ) {
  //       allTheTags[trendKey] = [];
  //     }
  //
  //     allTheTags[trendKey].push(tagKey);
  //   });
  //
  // });

  app.factory("ListWithTotal", ["$FirebaseArray", "$firebase", function($FirebaseArray, $firebase) {
    // create a new factory based on $FirebaseArray
    var TotalFactory = $FirebaseArray.$extendFactory({
      getTotal: function() {
        debugger;
        var total = 0;
        // the array data is located in this.$list
        angular.forEach(this.$list, function(rec) {
          total += rec.amount;
        });
        return total;
      }
    });

    return function(listRef) {
      // override the factory used by $firebase
      var sync = $firebase(listRef, {arrayFactory: TotalFactory});

      return sync.$asArray(); // this will be an instance of TotalFactory
    }
  }]);

}(angular, config));
