(function(factory) {
  if( typeof window !== 'undefined' ) {
    // browser
    window.api = {};
    factory(window, window.api);
  }
  else {
    // node.js
    factory({
      Firebase: require('firebase'),
      Q: require('q'),
      instance: process.env.instance || require('optimist').argv.instance
    }, exports);
  }
})(
  function(exports, api) {
    var URL;
    var Firebase = exports.Firebase;
    var Q = exports.Q;
    var instance = exports.instance;

    if (!instance) {
      throw new Error('Please provide firebase name by setting the API.URL variable.' +
        'For the web, just set an `instance` variable on `window`. ' +
        'For node.js, add an --instance="firebase_name" argument or add an instance env variable')
    }
    // we need the URL constructed somehow!
    URL = 'https://' + instance + '.firebaseio.com';

    /**
     * Creates a Firebase reference
     * @param {string} path
     * @returns {Firebase}
     */
    api.createRef = function (path) {
      var ref = new Firebase(URL);
      if (path) {
        ref = ref.child(path);
      }
      return ref;
    };

    /**
     * Returns an existing trend pojo or null if not found
     * @param shortName
     * @returns {object|null}
     */
    api.getTrend = function (shortName) {
      var def = Q.defer();
      api.createRef('trends/' + shortName).once('value', function (snap) {
        def.resolve(snap.val());
      }, def.reject);
      return def.promise;
    };

    /**
     * Creates a new trend. Requects promise if trend already exists.
     *
     * @param {string} shortName
     * @param {string} summary
     * @param {array} tags
     * @returns promise resolved to the Firebase ref for the new summary
     */
    api.createTrend = function (shortName, summary, tags) {
      return api.getTrend(shortName)
        .then(function(existingTrend) {
          if( existingTrend !== null ) {
            return Q.reject('already_exists');
          }
        })
        .then(function() {
          var def = Q.defer();
          var ref = api.createRef('trends/' + shortName);
          ref.set({
            summary: summary
          }, api.handle(def, ref));
          return def.promise;
        })
        .then(function(ref) {
          if( tags && tags.length ) {
            return api.addTags(ref.name(), tags).then(function() {
              return ref;
            });
          }
          else {
            return ref;
          }
        });
    };

    /**
     * Add an entry to an existing trend
     * @param {string} shortName
     * @param {string} userId
     * @param {string} url
     * @returns promise resolved to the Firebase ref for the new entry
     */
    api.addEntry = function (shortName, userId, url) {
      var ref = api.createRef('entries/' + shortName).push();
      var data = {
        source: url,
        userid: userId,
        timestamp: Firebase.ServerValue.TIMESTAMP
      };
      return createUrlIndexForEntry(url, ref.name(), shortName)
        .then(function() {
          var def = Q.defer();
          ref.setWithPriority(data, Firebase.ServerValue.TIMESTAMP, function(err) {
            if( err ) { def.reject(err); }
            else {
              api.createRef('trends/'+shortName+'/count').transaction(
                function(curr) {
                  return (curr||0)+1;
                },
                function(err, success, snap) {
                  if( err || !success ) {
                    def.reject(err||'aborted');
                  }
                  else {
                    def.resolve(ref);
                  }
                }
              );
            }
          });
          return def.promise;
        });
    };

    /**
     * Add one or more tags to a trend
     * @param {string} shortName
     * @param {array} newTags
     */
    api.addTags = function (shortName, newTags) {
      var promises = [];
      newTags.forEach(function (tag) {
        var def = Q.defer();
        promises.push(def.promise);
        var ref = api.createRef('tags/' + tag + '/' + shortName);
        ref.set(true, api.handle(def, ref))
      });
      return Q.allSettled(promises);
    };

    /**
     * Search for similar trends in Firebase. This will utilize Flashlight and perform an
     * ElasticSearch of existing trends.
     *
     * @param {string} term
     * @returns {TrendsSearch} with a run() and cancel() method
     */
    api.createTrendsSearch = function (term) {
      return new TrendsSearch(term);
    };

    /**
     * Create account for a Google authenticated user. This should be called any time a user authenticates with simple login.
     * Users will not manage their accounts, we'll just utilize third part data to populate whatever we can to identify users
     *
     * @param userObject the user returned from simple login auth
     * @returns promise that resolves to the Firebase ref for the new account
     */
    api.createAccount = function (userObject) {
      var def = Q.defer();
      if (!api.isFirebaseEmail(userObject.email)) {
        def.reject('invalid_email');
      }
      else {
        var ref = api.createRef('users/' + userObject.uid);
        ref.set({
          name: userObject.displayName,
          email: userObject.email,
          avatar: userObject.thirdPartyUserData.picture
        }, api.handle(def, ref));
      }
      return def.promise;
    };

    /**
     * Claim ownership of a URL. This will cause the plugin icon to change when other users view the page.
     * There can only be one owner and if another user tries to claim ownership it will result in an error.
     * URI parameters should be stripped off of the URL.
     *
     * @param {string} url
     * @param {string} userId
     * @param {string} stealFrom a user id to steal this from
     * @returns promise that resolves to the Firebase ref for the ownership item, or rejected with code: 'OWNED', if it is already owned
     */
    api.claimOwnership = function (url, userId, stealFrom) {
      var hash = api.createHashCode(url);
      var def = Q.defer();
      api.createRef('ownership/' + hash).transaction(function (currentVal) {
        if (currentVal !== null && currentVal !== stealFrom) return;
        else return userId;
      }, function (err, committed, snap) {
        if (err || !committed) {
          def.reject(err || 'already_claimed');
        }
        else {
          def.resolve(snap.ref());
        }
      });
      return def.promise;
    };

    /**
     * @param {string} url
     * @param {function} callback
     * @returns {function} a dispose method to stop listening
     */
    api.onOwnerChange = function (url, callback) {
      var hash = api.createHashCode(url);
      var ref = api.createRef('ownership/' + hash);
      var fn = ref.on('value', function (snap) {
        callback(snap.val());
      }, function(err) {
        throw new Error(err);
      });
      return function() {
        ref.off('value', fn);
      }
    };

    /**
     * Notify callback when this URL is added as an entry
     * @param {string} url
     * @param {function} callback
     */
    api.onEntryAdded = function(url, callback) {
      var ref = api.createRef('entries_by_url/'+api.createHashCode(url));
      var fn = ref.on('value', function(snap) {
        if( snap.val() === null ) { return; }
        ref.off('value', fn);
        callback(snap.val());
      });
    };

    /**
     * Notifies whenever the trend is changed
     * @param {string} shortName
     * @param {function} callback
     * @returns {function} a dispose method to stop listening
     */
    api.onTrendChange = function(shortName, callback) {
      var ref = api.createRef('trends/'+shortName);
      var fn = ref.on('value', function(snap) {
        callback(snap.val(), ref);
      });
      return function() {
        ref.off('value', fn);
      }
    };

    /**
     * Parse document or contact an appropriate API and fetch the data for this particular case/discussion/etc.
     * Creates a POJO suitable for use in creating trends and entries, with the following key/value pairs:
     *    {string} type: one of desk, github, stackoverflow, googlegroup, or other
     *    {string} group: for type github or gg, this is something like "firebase/angularfire" or "firebase-talk"
     *    {string} id: for other, this is a null, otherwise it's the unique id for the type/group in question
     *    {string} summary
     *    {array}  tags
     *    {string} url
     *
     * @param {string} url
     * @param {HTMLElement} documentBody (window.document.body)
     * @returns promise resolves to the pojo after finishing parsing or contacting API
     */
    api.scrapeResource = function (url, documentBody) {};

    /**
     * Create a short name for a trend
     * @param {string} summary
     * @returns {string}
     */
    api.createShortName = function (summary) {
      return summary
        .toLowerCase()
        .replace(/[^\w\s]+/g, '')
        .replace(REGEX_ARTICLES, '')
        .trim()
        .replace(/\s+/g, '-')
        .substr(0, 40);
    };
    var REGEX_ARTICLES = /\b(its|this|how|do|i|is|a|about|after|an|and|at|by|for|from|in|into|nor|of|on|onto|over|the|to|up|with|within)\b/g;

    /**
     * Create a JavaScript hash code of a string (for creating keys from urls)
     * @param {string} s
     * @returns {string}
     */
    api.createHashCode = function (s) {
      var hash = 0, i, chr, len;
      if (s.length == 0) return hash;
      for (i = 0, len = s.length; i < len; i++) {
        chr = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return 'hash' + hash;
    };

    /**
     * Check to see if email address belongs to firebase domain
     * @param {string} email
     * @returns {boolean}
     */
    api.isFirebaseEmail = function (email) {
      return !!email && !!email.match(/@firebase\.com$/);
    };

    /**
     * Fetch a user's record
     */
    api.getUser = function(uid) {
      var def = Q.defer();
      api.createRef('users/'+uid).once('value', function(snap) {
        def.resolve(snap.val());
      }, def.reject);
      return def.promise;
    };

    /**
     * Provide a firebase callback compatible function and resolve/reject a
     * future when it is invoked.
     * @param def
     * @param result
     * @returns {Function}
     */
    api.handle = function(def, result) {
      return function(err) {
        if( err ) { def.reject(err); }
        else { def.resolve(result); }
      }
    };

    api.getTrendForUrl = function(url) {
      var def = Q.defer();
      api.createRef('trends_by_url/'+api.createHashCode(url))
        .once('value', function(snap) {
          def.resolve(snap.val());
        }, def.reject);
      return def.promise;
    };

    function createUrlIndexForEntry(url, key, shortName) {
      var def = Q.defer();
      var hash = api.createHashCode(url);
      var indexRef = api.createRef('entries_by_url/'+hash);
      indexRef.transaction(function(currValue) {
        if( currValue !== null ) { return; }
        return key;
      }, function(err, success, snap) {
        if (err || !success) {
          def.reject(err || 'already_added');
        }
        else {
          api.createRef('trends_by_url/'+hash).set(shortName);
          def.resolve(snap.ref());
        }
      });
      return def.promise;
    }

    /**
     * Perform a search of the trends/ table using ElasticSearch. Also includes a list of entries
     * for each matching trend.
     *
     * @constructor
     */
    function TrendsSearch(term) {
      if( !term.match(/^\*/) ) { term = '*'+term; }
      if( !term.match(/\*$/) ) { term += '*'; }
      this.query = {
        'query_string': { query: term }
      };
      this._canceled = false;
    }
    TrendsSearch.prototype = {
      /**
       * Runs the search and returns an array of POJOs with the following structure:
       *    {string} id      - the firebase path key (the short name for the trend)
       *    {int}    count   - the number of "entries" for this trend
       *    {string} summary - the descriptive summary of the trend
       *    {object} entries - list of entries for the trend, with keys source, timestamp, and userid
       *
       * @returns promise which resolves to an array
       */
      run: function() {
        return this._doSearch(this.query)
          .then(this._getEntries.bind(this))
          .then(this._sendResults.bind(this));
      },
      cancel: function() {
        this._canceled = true;
      },
      _sendResults: function(hits) {
        var self = this;
        return $.Deferred(function(def) {
          if( self._canceled ) {
            def.reject('canceled');
          }
          else {
            def.resolve(hits);
          }
        }).promise();
      },
      _doSearch: function(query) {
        var def = $.Deferred();
        var ref = new Firebase(URL+'/search');
        var key = ref.child('request').push({ index: 'firebase', type: 'trend', query: query }).name();
  //      console.log('search', key, { index: index, type: type, query: query });
        ref.child('response/'+key).on('value', function fn(snap) {
          if( snap.val() === null ) { return; }
          snap.ref().off('value', fn);
          snap.ref().remove();
          def.resolve(this._parseResults(snap.val()));
        }, def.reject, this);
        return def.promise();
      },
      _parseResults: function(results) {
        if( results.hits ) {
          $.each(results.hits, function(k,v) {
            results.hits[k] = $.extend({id: v._id, score: v._score}, v._source);
          });
        }
        return results.hits || [];
      },
      _getEntries: function(hits) {
        var def;
        var fb = new Firebase(URL+'/entries');
        if( hits && !this._canceled ) {
          var promises = [];
          $.each(hits, function(k, hit) {
            promises.push($.Deferred(function(def) {
              fb.child(hit.id).endAt().limit(5).once('value', function(snap) {
                hit.entries = snap.val() || {};
                def.resolve();
              }, def.reject);
            }).promise());
          });
          def = $.when.apply($, promises).then(function() {
            return hits;
          })
        }
        else {
          def = $.Deferred(function(def) { def.resolve(hits); });
        }
        return def.promise();
      }
    };
  }
);