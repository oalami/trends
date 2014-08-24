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
      //todo prevent the same page from being added multiple times
      //todo by adding an index of which pages were entered as an entry
      //todo can hash the urls to make this simple and fast
      var def = Q.defer();
      var ref = api.createRef('entries/' + shortName).push();
      var data = {
        source: url,
        userid: userId,
        timestamp: Firebase.ServerValue.TIMESTAMP
      };
      ref.set(data, function(err) {
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
     * Search for similar trends in Firebase. This will utilize Flashlight and perform an ElasticSearch of existing
     * trends. The results returned will be POJOs containing at least the following:
     *   {string} id
     *   {string} summary
     *   {string} tags
     *   {string} url
     *
     * @param {string} term
     * @returns promise that resolves to an array of results
     */
    api.searchForTrends = function (term) {};

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
     * @returns promise that resolves to the Firebase ref for the ownership item, or rejected with code: 'OWNED', if it is already owned
     */
    api.claimOwnership = function (url, userId) {
      var hash = api.createHashCode(url);
      var def = Q.defer();
      api.createRef('ownership/' + hash).transaction(function (currentVal) {
        if (currentVal !== null) return;
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
     * @returns promise that resolves to a user id or null (if not owned)
     */
    api.onOwnerChange = function (url, callback) {
      var hash = api.createHashCode(url);
      api.createRef('ownership/' + hash).on('value', function (snap) {
        callback(snap.val());
      }, function(err) {
        throw new Error(err);
      });
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
        .replace(REGEX_ARTICLES, '')
        .replace(/[^\w\s]+/g, '')
        .replace(/\s+/g, '-');
    };
    var REGEX_ARTICLES = /\b(is|a|about|after|an|and|at|by|for|from|in|into|nor|of|on|onto|over|the|to|up|with|within)\b/gi;

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
    }
  }
);