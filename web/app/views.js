(function(Trends, Backbone, _) {

    var TrendRow = Backbone.View.extend({
        tagName: 'tr',

        template: template('trendTemplate'),

        initialize: function() {
            this.render();
            this.listenTo(this.model, 'change', this.render);
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
            this.listenTo(this.collection, 'add', this.addOne);
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
          this.render();
        },

        render: function() {
          debugger;
            var trendBody = new TrendBody({ collection: this.collection });
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
        },

        render: function() {
            this.$el.html(this.template());
            this.$entryList = this.$el.children().children('#entryList');
            this.collection.each(function(entry) {
               this.$entryList.append(new EntryView({ model: entry }).el);
            }, this);
            return this;
        }

    });

    var EntryView = Backbone.View.extend({
        tagName: 'tr',
        template: template('entryTemplate'),

        initialize: function() {
            this.render();
        },

        render: function() {
            console.log(this.model.toJSON());
            this.$el.append(this.template(this.model.toJSON()));
            return this;
        }

    });

    Trends.Views = {
      Row: TrendRow,
      Body: TrendBody,
      Table: TrendsTable
    };

}(window.Trends, window.Backbone, window._));
