// stuff for test units
var Firebase = require('firebase');
var argv = require('optimist').argv;
var instance = process.env.instance || argv.instance;
if( !instance  ) { throw new Error('Please provide --instance="firebase_name" argument or add an instance env variable')}

// we need the URL constructed somehow!
var URL = 'https://'+instance+'.firebaseio.com';

// we need Q included somehow!
var Q = require('q');

// right now all the methods are put onto the global `api` variable
// or for node test units, into exports
var api = typeof exports !== 'undefined'? exports : {};

/**
* Creates a Firebase reference
* @param {string} path
* @returns {Firebase}
*/
api.createRef = function(path) {
  var ref = new Firebase(URL);
  if( path ) { ref = ref.child(path); }
  return ref;
};

/**
 * Returns an existing trend pojo or null if not found
 * @param shortName
 * @returns {object|null}
 */
api.getTrend = function(shortName) {
  var def = Q.defer();
  api.createRef('trends/'+shortName).once('value', function(snap) {
    def.resolve(snap.val());
  }, def.reject);
  return def.promise;
};

/**
 * Creates a new trend.
 * @param {string} shortName
 * @param {string} summary
 * @returns promise resolved to the Firebase ref for the new summary
 */
api.createTrend = function(shortName, summary) {
  var def = Q.defer();
  var trendRef = api.createRef('trends/'+shortName);
  trendRef.set({
    summary: summary
  }, function(err) {
    if( err ) { def.reject(err); }
    else { def.resolve(trendRef); }
  });
  return def.promise;
};

/**
 * Add an entry to an existing trend
 * @param {string} shortName
 * @param {object} entry (should exactly match the entries/$trendid/$entry fields)
 * @returns promise resolved to the Firebase ref for the new entry
 */
api.addEntry = function(shortName, entry) {
  var def = Q.defer();
  api.createRef('entries/'+shortName).push(entry, function(err) {
    if( err ) { }
  });
  return def.promise;
};

/**
 * Add one or more tags to a trend
 * @param {string} shortName
 * @param {array} newTags
 */
api.addTags = function(shortName, newTags) {
  var promises = [];
  newTags.forEach(function(tag) {
    var def = Q.defer();
    promises.push(def.promise);
    var ref = createRef('tags/'+tag+'/'+shortName);
    ref.set(true, function(err) {
      if( err ) { def.reject(err); }
      else { def.resolve(ref); }
    })
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
api.searchForTrends = function(term) {};

/**
 * Create account for a Google authenticated user. This should be called any time a user authenticates with simple login.
 * Users will not manage their accounts, we'll just utilize third part data to populate whatever we can to identify users
 *
 * @param userObject the user returned from simple login auth
 * @returns promise that resolves to the Firebase ref for the new account
 */
api.createAccount = function(userObject) {
  var def = Q.defer();
  if( !api.isFirebaseEmail(userObject.email) ) {
    def.reject('invalid_email');
  }
  else {
    var ref = api.createRef('users/'+userObject.uid);
    ref.set({
      name: userObject.displayName,
      email: userObject.email,
      avatar: userObject.thirdPartyUserData.picture
    }, function(err) {
      if( err ) { def.reject(err); }
      else { def.resolve(ref); }
    });
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
api.claimOwnership = function(url, userId) {
  var hash = api.createHashCode(url);
  var def = Q.defer();
  api.createRef('ownership/'+hash).transaction(function(currentVal) {
    if( currentVal !== null ) return;
    else return userId;
  }, function(err, committed, snap) {
    if( err || !committed ) {
      def.reject(err||'already_claimed');
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
api.getOwner = function(url) {
  var hash = api.createHashCode(url);
  var def = Q.defer();
  api.createRef('ownership/'+hash).once('value', function(snap) {
    def.resolve(snap.val());
  }, def.reject.bind(def));
  return def.promise;
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
api.scrapeResource = function(url, documentBody) {};

/**
 * Create a short name for a trend
 * @param {string} summary
 * @returns {string}
 */
api.createShortName = function(summary) {
  return summary
    .toLowerCase()
    .replace(REGEX_ARTICLES, '')
    .replace(/[^\w\s]+/g,'')
    .replace(/\s+/g,'-');
};
var REGEX_ARTICLES = /\b(is|a|about|after|an|and|at|by|for|from|in|into|nor|of|on|onto|over|the|to|up|with|within)\b/gi;

/**
 * Create a JavaScript hash code of a string (for creating keys from urls)
 * @param {string} s
 * @returns {string}
 */
api.createHashCode = function(s) {
  var hash = 0, i, chr, len;
  if (s.length == 0) return hash;
  for (i = 0, len = s.length; i < len; i++) {
    chr   = s.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return 'hash'+hash;
};

/**
 * Check to see if email address belongs to firebase domain
 * @param {string} email
 * @returns {boolean}
 */
api.isFirebaseEmail = function(email) {
  return !!email && !!email.match(/@firebase\.com$/);
};