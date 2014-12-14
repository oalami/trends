(function(angular, config) {
  "use strict";

  var app = config.app();

  app.directive('trendsTable', function($compile) {
    return {
      restrict: 'EA',
      transclude: true,
      template: '',
      link: function (scope, element) {
        debugger;
        //element.dataTable();
      }
    };
  });

}(angular, config));
