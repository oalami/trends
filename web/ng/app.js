(function(angular) {
  "use strict";

  angular.module('trends', ['firebase', 'ngRoute', '$firebaseMockAuth', 'authRequired'])

  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        controller: 'LoginCtrl',
        templateUrl: 'views/login.html',
        authRequired: false
      })
      .when('/trends', {
        controller: 'TrendsCtrl',
        templateUrl: 'views/trends.html',
        authRequired: true
      })
      .otherwise('/404');
  })

  .constant('FBURL', 'https://trends.firebaseio.com/')

  // Helper factory for changing routes
  .factory('routeTo', function($window) {

    function route(path) {
      $window.location.href = '#' + path;
    }

    return route;

  })

  .service('Root', ['FBURL', Firebase])

  .run(function($rootScope, routeTo) {
    $rootScope.$on('authRequired:unauthorized', function(e, name) {
      routeTo('/');
    });
  });

}(window.angular));
