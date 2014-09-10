(function(Trends, Backbone) {

    var Trend = Backbone.Model.extend({
        defaults: {
            summary: 'hi'
        }
    });

    Trends.Models = {
        Trend: Trend
    };

}(window.Trends, window.Backbone));