(function(angular) {
  "use strict";

  angular.module('trends', ['firebase', 'ngRoute', '$firebaseMockAuth', 'authRequired'])

  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        controller: 'LoginCtrl',
        templateUrl: 'views/login.html'
      })
      .when('/trends', {
        controller: 'TrendsCtrl',
        templateUrl: 'views/trends.html',
        authRequired: true,
        resolve: {
          tags: function(Tags, TagsRef) {
            var $tagsArray = Tags(TagsRef);
            return $tagsArray.$loaded();
          }
        }
      })
      .when('/entries/:id', {
        controller: 'EntriesCtrl',
        templateUrl: 'views/entries.html',
        authRequired: true,
        resolve: {
          entries: function($entries, $route) {
            return $entries($route.current.params.id).$asArray().$loaded();
          }
        }
      })
      .when('/404', {
        templateUrl: 'views/404.html'
      })
      .otherwise('/404');
  })

  .constant('FBURL', 'https://trends.firebaseio.com/')

  .constant('TAGS_URL', 'https://trends.firebaseio.com/tags')

  .constant('TRENDS_URL', 'https://trends.firebaseio.com/trends')

  .constant('USERS_URL', 'https://trends.firebaseio.com/users')

  // Helper factory for changing routes
  .factory('routeTo', function($window) {

    function route(path) {
      $window.location.href = '#' + path;
    }

    return route;

  })

  .service('Root', ['FBURL', Firebase])

  .service('TagsRef', ['TAGS_URL', Firebase])

  .service('TrendsRef', ['TRENDS_URL', Firebase])

  .service('UsersRef', ['USERS_URL', Firebase])

  .run(function($rootScope, routeTo) {
    // if the user does not belong send the home
    $rootScope.$on('authRequired:unauthorized', function(e, name) {
      routeTo('/');
    });
  });

}(window.angular));
