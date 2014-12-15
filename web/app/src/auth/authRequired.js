(function(angular, config) {
  "use strict";

  angular.module('authRequired', ['firebase'])

  .service('Root', ['FBURL', Firebase])

  .run(function($firebaseAuth, Root, $rootScope, $window) {
    var auth = $firebaseAuth(Root);

    $rootScope.$on('$routeChangeStart', function(e, route) {
      var nextRoute = route.$$route;
      var user;
      if(nextRoute && nextRoute.authRequired) {
        user = auth.$getAuth();
        if(!user) {
          $rootScope.$emit('authRequired:unauthorized', new Error('Unauthorized access.'));
        }
      }
    });

  });

}(window.angular, config));
