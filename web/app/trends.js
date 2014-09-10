(function(window, $, Backbone, _) {

    window.Trends = {
        Models: {},
        Views: {},
        Collections: {},
        Data: {},
        Utils: {},
        Vents: _.extend({}, Backbone.Events),
        init: function initApp () {
            var app = new Trends.Views.App();
            new Trends.Router();
            Backbone.history.start();
        }
    };

    window.template = function(id) {
        return _.template( $( '#' + id ).html() );
    }

}(window, jQuery, Backbone, _));