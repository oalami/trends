(function(Trends) {
  "use strict";

  var Controller = Backbone.View.extend({
    firebase: null,
    collections: {},
    router: null,
    currentPage: 'trends',
    el: '#app',

    initialize: function() {
      //this.$el = $('#app');

      // init router
      this.router = new Trends.Router();

      // load data
      this.collections.trends = new Trends.Collections.Trends();
      Trends.Data.getTrendData(_.bind(function onComplete(trends) {
        var trendsArray = Trends.Utils.jsonToArray(trends);
        this.collections.trends.add(trendsArray);
        Trends.Vents.trigger('trendsSync', this.collections.trends);
      }, this));

      // listen for routes
      Trends.Vents.on('index', this.index, this);
      Trends.Vents.on('details', this.details, this);
      Trends.Vents.on('edit', this.edit, this);

      // default to index
    },

    render: function() {

    },

    index: function() {
      var trendsTable = new Trends.Views.Table({ collection: this.collections.trends });
      this.$el.html(trendsTable);
      debugger;
    },

    details: function(id) {
      console.log(id);
    },

    edit: function (id) {

    }


  });

  Trends.Views.Controller = Controller;

}(window.Trends));
