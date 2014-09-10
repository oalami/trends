(function(Trends, Backbone) {

    var TrendsCollection = Backbone.Collection.extend({
        model: Trends.Models.Trend
    });

    Trends.Collections = {
        Trends: TrendsCollection
    };

}(window.Trends, window.Backbone));