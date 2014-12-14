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
