(function(angular, config) {
  "use strict";

  var app = config.app();

  app.controller('LoginCtrl', function($scope, $window, Auth, routeTo) {
    // Change status of message screen based on passed ENUM
    // Can provide custom message if desired
    function changeStatus(status, msg) {
      var returnStatus;

      returnStatus = {
        status: status,
        message: msg || Auth.STATUS_MESSAGE[status]
      };

      return returnStatus;
    };

    $scope.loginStatus = changeStatus(Auth.STATUS.ANON);

    Auth.authWithGoogle()
      .then(function(user) {
        $scope.loginStatus = changeStatus(Auth.STATUS.SUCCESS)
        routeTo('/trends');
      })
      .catch(function(error) {
        $scope.loginStatus = changeStatus(Auth.STATUS.ERROR, error.message);
      });
  });

}(window.angular, config));
