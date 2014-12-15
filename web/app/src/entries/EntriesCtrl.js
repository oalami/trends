(function(angular, config) {
  "use strict";

  var app = config.app();

  app.controller('EntriesCtrl', function($scope, entries) {
    entries.getUserInfo().then(function(userEntries) {
      $scope.entries = userEntries;
    });
  });

}(angular, config));
