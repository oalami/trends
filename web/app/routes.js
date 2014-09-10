(function(Trends, Backbone) {

    Trends.Router = Backbone.Router.extend({

        routes: {
            '': 'index',
            'details/:id': 'details',
            'edit/:id': 'edit'
        },

        index: function() {
            Trends.Vents.trigger('index');
        },

        // View trend and it's entries
        details: function(id) {
            Trends.Vents.trigger('details', id);
        },

        edit: function(id) {
            Trends.Vents.trigger('edit', id);
        }

    });

}(window.Trends, window.Backbone));