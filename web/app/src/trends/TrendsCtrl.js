(function(angular, config) {
  "use strict";

  var app = config.app();

  app.controller('TrendsCtrl', function($scope, Tags, Root, $timeout, tagsArray) {

    tagsArray.getTrends({
      onComplete: function(trends) {
        $scope.trends = trends;
      }
    });

  });

}(angular, config));
