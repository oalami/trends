(function(Trends, Backbone, _) {

    var TrendRow = Backbone.View.extend({
        tagName: 'tr',

        template: template('trendTemplate'),

        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }

    });

    var TrendBody = Backbone.View.extend({
        tagName: 'tbody',
        id: '#trendsBody',

        initialize: function() {
            this.render();
            this.parentTable = $('#trendsTable');
            this.listenTo(this.collection, 'change', this.render);
        },

        addOne: function(trend) {
            var trendRow = new TrendRow({ model: trend });
            this.$el.append(trendRow.el);
        },

        render: function() {
            this.collection.each(this.addOne, this);
            return this;
        }

    });

    var TrendsTable = Backbone.View.extend({
        el: '#trendsTable',

        initialize: function() {
            this.tbody = null;
            // load the data and convert it to an array
            Trends.Data.getTrendData(function(trendsData) {
                Trends.Vents.trigger('trends:show', Trends.Utils.jsonToArray(trendsData), this);
            });

            // create a collection
            Trends.Vents.on('trends:show', function(trendsArray) {
                var trendsCollection = new Trends.Collections.Trends(trendsArray);
                this.collection = trendsCollection;
                this.render();
            }, this);
        },

        render: function() {
            var trendBody = new TrendBody({ collection: this.collection });
            if(this.tbody) {
                this.tbody.$el.remove();
            }
            this.tbody = trendBody;
            this.$el.append(this.tbody.el);
            this.$el.dataTable();
        }
    });

    var DetailsView = Backbone.View.extend({
       tagName: 'div',
       template: template('detailsTemplate'),

        initialize: function() {
            this.render();
            //this.listenTo(this.model, 'change', this.addOne);
        },

        render: function() {
            console.log(this.template());
            this.$el.html(this.template());
            return this;
        }

    });

    var TrendApp = Backbone.View.extend({
        el: '#app',

        initialize: function() {
            Trends.Vents.on('index', this.showIndex, this);
            Trends.Vents.on('details', this.showDetails, this);
        },

        // Get the Trend Data
        // Create the Trend Collection
        // Create TrendBody View
        // - Create each row
        showIndex: function() {

            // clean up any existing views
            this.cleanUp();

            this.$el.html(template('index')());
            var trendTable = new Trends.Views.Table();

        },

        showDetails: function (id) {
            this.cleanUp();
            this.$el.html(new DetailsView().el);
            console.log(id);
        },

        cleanUp: function() {
            // check the #app and clear out and models and such
            this.$el.html('');
        },

        render: function() {
            return this;
        }

    });

    Trends.Views = {
      Row: TrendRow,
      Body: TrendBody,
      App: TrendApp,
      Table: TrendsTable
    };

}(window.Trends, window.Backbone, window._));