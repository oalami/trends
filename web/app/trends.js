(function(window, $, Backbone, _) {

  window.Trends = {
    Models: {},
    Views: {},
    Collections: {},
    Data: {},
    Utils: {},
    Vents: _.extend({}, Backbone.Events)
  };

  window.template = function(id) {
    return _.template( $( '#' + id ).html() );
  }

}(window, jQuery, Backbone, _));
