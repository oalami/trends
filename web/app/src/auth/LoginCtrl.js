(function(angular, config) {
  "use strict";

  var app = config.app();

  app.controller('LoginCtrl', function($scope, $window, Auth, routeTo) {

    // no user before logged in
    $scope.user = null;

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
      // set the user when logged in
      $scope.user = user;
      // change the status message on the view
      $scope.loginStatus = changeStatus(Auth.STATUS.SUCCESS);
      // route to the trends page
      //routeTo('/trends');
    })
    .catch(function(error) {
      $scope.loginStatus = changeStatus(Auth.STATUS.ERROR, error.message);
    });
    
  });

}(window.angular, config));
