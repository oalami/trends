(function(angular, config) {
  "use strict";

  var app = config.app();

  app.controller('TrendsCtrl', function($scope, Tags, Root, $timeout, tagsArray) {
    
    $scope.tagsArray = tagsArray;

    // $tagsArray.$loaded().then(function(items) {
    //   $tagsArray.getTrends(function(trends) {
    //     $scope.trends = trends;
    //   });
    // });

  });

}(angular, config));
