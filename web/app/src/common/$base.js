(function(angular, config) {
  "use strict";

  var app = config.app();

  app.factory('$base', function($firebase, Root) {
    return function $base(path, factory) {
      // if the path is provided then append and return binding
      if(path) {
        var $base;
        if(factory) {
          $base = $firebase(Root.child(path), factory);
        } else {
          $base = $firebase(Root.child(path));
        }
        return $base;
      }

      // if no path is provided return the binding from the Root ref
      return $firebase(Root);
    };
  });

}(angular, config));
