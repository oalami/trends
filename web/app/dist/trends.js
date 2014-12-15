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
          tagsArray: function(Tags, TagsRef) {
            var $tagsArray = Tags(TagsRef);
            return $tagsArray.$loaded();
          }
        }
      })
      .when('/404', {
        templateUrl: 'misc/404.html'
      })
      .otherwise('/404');
  })

  .constant('FBURL', 'https://trends.firebaseio.com/')

  .constant('TAGS_URL', 'https://trends.firebaseio.com/tags')

  .constant('TRENDS_URL', 'https://trends.firebaseio.com/trends')

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

  .run(function($rootScope, routeTo) {
    // if the user does not belong send the home
    $rootScope.$on('authRequired:unauthorized', function(e, name) {
      routeTo('/');
    });
  });

}(window.angular));

(function(window, angular) {
  "use strict";

  window.config = (function() {
    var settings = {
      name: 'trends',
      app: function() {
        return angular.module(settings.name);
      }
    }
    return settings;
  }());

}(window, window.angular));

(function(angular, config) {
  "use strict";

  var user = {
    uid: '1',
    email: 'david@firebase.com',
    providerid: '024112'
  };

  angular.module('$firebaseMockAuth', [])

  .constant('MockLoginError', false)

  .constant('MockUser', user)

  .constant('MockUserError', 'Invalid Email')

  // Mock service for logging in with third party auth
  .factory('$firebaseAuth', function(MockUser, MockUserError, MockLoginError) {
    var willError = MockLoginError;

    // create a fake user depending on the login
    function prepMockUser(provider, mockUser) {
      if(!mockUser) { return; }
      var user = {};
      user.uid = mockUser.uid;
      user[provider] = {
        email: mockUser.email
      };
      user[provider][provider + 'id'] = mockUser.providerid;
      return user;
    }

    // fake the user returned
    function mockThen(fn, user) {
      fn.call(this, user);
    }

    // fake the error message
    function mockCatch(errFn, msg) {
      errFn.call(this, new Error(msg));
    }

    function $authWithOAuthRedirect(provider) {

      return {

        then: function(fn) {
          var user = prepMockUser(provider, MockUser);

          // if there is a user fire then
          if(user) {
            mockThen(fn, user);
          }

          return {

            catch: function(errorFn) {
              // no user returns an error
              if(!user) {
                mockCatch(errorFn, MockUserError);
              }
            }

          };

        }

      };

    }

    function $getAuth() {
      return prepMockUser('google', MockUser);
    }

    return function(ref) {
      return {
        $authWithOAuthRedirect: $authWithOAuthRedirect,
        $getAuth: $getAuth,
        _firebase: ref
      };
    };

  });

}(angular, config));

(function(angular, config) {
  "use strict";

  var app = config.app();

  app.factory('Auth', function(FireAuth, $q) {
    var auth = FireAuth;
    var deferred = $q.defer();
    return {
      authWithGoogle: function() {
        auth.$authWithOAuthRedirect('google').then(function(authData) {
          var googleUser = authData.google;
          if (!googleUser.email || !googleUser.email.match(/@firebase.com$/) ) {
            throw new Error('Invalid email; not a Firebase.com account');
          }
          deferred.resolve(authData);
        }).catch(function(error) {
          deferred.reject(error);
        });

        return deferred.promise;
      },
      STATUS: {
        ANON: 'ANON',
        SUCCESS: 'SUCCESS',
        ERROR: 'ERROR',
        UNK: 'UNK'
      },
      STATUS_MESSAGE: {
        ANON: 'Attempting to Log In...',
        SUCCESS: 'Logging In...',
        ERROR: 'Error logging in.',
        UNK: 'Unknown error.'
      }
    };
  });

}(window.angular, config));

(function(angular, config) {
  "use strict";

  var app = config.app();

  app.factory('FireAuth', function($firebaseAuth, Root) {
    return $firebaseAuth(Root);
  });

}(window.angular, config));

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

(function(angular, config) {
  "use strict";

  angular.module('authRequired', ['firebase'])

  .service('Root', ['FBURL', Firebase])

  .run(function($firebaseAuth, Root, $rootScope, $window) {
    var auth = $firebaseAuth(Root);

    $rootScope.$on('$routeChangeStart', function(e, route) {
      var nextRoute = route.$$route;
      var user;
      if(nextRoute.authRequired) {
        user = auth.$getAuth();
        if(!user) {
          $rootScope.$emit('authRequired:unauthorized', new Error('Unauthorized access.'));
        }
      }
    });

  });

}(window.angular, config));

(function(angular, config) {
  "use strict";

  var app = config.app();

  app.factory('$trends', function($firebase, Root) {
    return function $trends(path) {
      // if the path is provided then append and return binding
      if(path) {
        return $firebase(Root.child(path));
      }

      // if no path is provided return the binding from the Root ref
      return $firebase(Root);
    };
  });

}(angular, config));

(function(angular, config) {
  "use strict";

  var app = config.app();

  app.factory('Tags', function($FirebaseArray, $firebase, TrendsRef, $timeout) {

    function getTrends(trendsRef, allTheTags, onComplete) {
      var allTheTrends = {};
      var query = trendsRef.orderByKey();

      query.on('value', function(snap) {

        snap.forEach(function(ss) {
          var trendObject = ss.val();
          var trendName = ss.key();

          trendObject.tags = allTheTags[trendName]||[];
          allTheTrends[trendName] = trendObject;
          allTheTrends[trendName].id = trendName;

        });

        if (onComplete) {
          $timeout(function() {
            onComplete.call(this, allTheTrends);
          });
        }

      });

    }

    var TagsFactory = $FirebaseArray.$extendFactory({
      getTrends: function(params) {
        var allTheTags = [];
        angular.forEach(this.$list, function(tag) {
          // $id
          var tagId = tag.$id;
          angular.forEach(tag, function(value, key) {
            if(key.indexOf('$') === 0) { return; } // no $ props

            if(!allTheTags[key]) {
              allTheTags[key] = [];
            }

            allTheTags[key].push(tagId);

          });

          getTrends(TrendsRef, allTheTags, params.onComplete);

        });
      }
    });

    return function(listRef) {
      var sync = $firebase(listRef, {arrayFactory: TagsFactory});
      return sync.$asArray();
    }
  });

  // loop through each tag to get the trend keys
  // snap.forEach(function(snapTag) {
  //   var tagKey = snapTag.name();
  //
  //   snapTag.forEach(function (snapTrend) {
  //     var trendKey = snapTrend.name();
  //
  //     if( !allTheTags[trendKey] ) {
  //       allTheTags[trendKey] = [];
  //     }
  //
  //     allTheTags[trendKey].push(tagKey);
  //   });
  //
  // });

  app.factory("ListWithTotal", ["$FirebaseArray", "$firebase", function($FirebaseArray, $firebase) {
    // create a new factory based on $FirebaseArray
    var TotalFactory = $FirebaseArray.$extendFactory({
      getTotal: function() {
        debugger;
        var total = 0;
        // the array data is located in this.$list
        angular.forEach(this.$list, function(rec) {
          total += rec.amount;
        });
        return total;
      }
    });

    return function(listRef) {
      // override the factory used by $firebase
      var sync = $firebase(listRef, {arrayFactory: TotalFactory});

      return sync.$asArray(); // this will be an instance of TotalFactory
    }
  }]);

}(angular, config));

(function(angular, config) {
  "use strict";

  var app = config.app();

  app.controller('TrendsCtrl', function($scope, Tags, Root, $timeout, tagsArray) {

    tagsArray.getTrends({
      onComplete: function(trends) {
        $scope.trends = trends;
      }
    });

  });

}(angular, config));
