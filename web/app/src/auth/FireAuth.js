(function(angular, config) {
  "use strict";

  var app = config.app();

  app.factory('FireAuth', function($firebaseAuth, Root) {
    return $firebaseAuth(Root);
  });

}(window.angular, config));
