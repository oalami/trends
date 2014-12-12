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
