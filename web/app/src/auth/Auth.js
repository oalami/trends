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
