(function(angular, config) {
  "use strict";

  var app = config.app();

  app.controller('TrendsCtrl', function($scope, tags) {

    tags.getTrends({
      onComplete: function(trends) {
        $scope.trends = trends;
      }
    });

  });

}(angular, config));
