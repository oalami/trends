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
