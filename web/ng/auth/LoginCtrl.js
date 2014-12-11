(function(angular, config) {
  "use strict";

  var app = config.app();

  app.controller('LoginCtrl', function($scope, $window, Auth, routeTo) {

    var STATUS = {
      ANON: 'ANON',
      SUCCESS: 'SUCCESS',
      ERROR: 'ERROR',
      UNK: 'UNK'
    };

    var STATUS_MESSAGE = {
      ANON: 'Attempting to Log In...',
      SUCCESS: 'Logging In...',
      ERROR: 'Error logging in.',
      UNK: 'Unknown error.'
    };

    // Change status of message screen based on passed ENUM
    // Can provide custom message if desired
    function changeStatus(status, msg) {
      var returnStatus;

      returnStatus = {
        status: status,
        message: msg || STATUS_MESSAGE[status]
      };

      return returnStatus;
    }

    $scope.loginStatus = changeStatus(STATUS.ANON);

    Auth.authWithGoogle()
      .then(function(user) {
        $scope.loginStatus = changeStatus(STATUS.SUCCESS)
        routeTo('/trends');
      })
      .catch(function(error) {
        $scope.loginStatus = changeStatus(STATUS.ERROR, error.message);
      });
  });

}(window.angular, config));
