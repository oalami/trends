(function(angular, config) {
  "use strict";

  var app = config.app();

  app.factory('$entries', function($base) {
    return function $entries (id) {
      return $base('/entries/' + id);
    };
  });

}(angular, config));
