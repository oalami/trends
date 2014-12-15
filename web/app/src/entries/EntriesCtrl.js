(function(angular, config) {
  "use strict";

  var app = config.app();

  app.controller('EntriesCtrl', function($scope, entries) {
    console.log(entries);
    $scope.entries = entries;
  });

}(angular, config));
