var Firebase = require('firebase');
var api = require('../api_methods.js');
var seed = require('../seed-data.json');

exports.setUp = function(done) {
  api.createRef().set(seed, done);
};

exports.testGetTrend_exists = function(test) {
  test.expect(1);
  api.getTrend('wants-keyboard')
    .then(function(data) {
      test.ok(data !== null, 'found data (was not null)');
    })
    .fin(test.done)
    .done();
};

exports.testGetTrend_notfound = function(test) {
  test.expect(1);
  api.getTrend('notarealtrendname')
    .then(function(data) {
      test.equal(data, null);
    })
    .fin(test.done)
    .done();
};

exports.testGetOwner = function(test) {
  test.expect(1);
  api.getOwner('https://github.com/firebase/angularfire/issues/386')
    .then(function(uid) {
      test.equal(uid, 'kato');
    })
    .fin(test.done)
    .done();
};

exports.testCreateShortName = function(test) {
  test.equal(api.createShortName('This is a bunch of text to test'), 'this-bunch-text-test');
  test.done();
};

exports.testCreateHashCode = function(test) {
  test.equal(api.createHashCode('Happy happy joy joy'), 'hash-1854761240');
  test.done();
};

exports.testClaimOwnership_alreadyClaimed = function(test) {
  test.expect(1);
  api.claimOwnership('https://github.com/firebase/angularfire/issues/386', 'kato')
    .catch(function (err) {
      test.equal(err, 'already_claimed');
    })
    .fin(test.done);
};

exports.testClaimOwnership_valid = function(test) {
  test.expect(1);
  api.claimOwnership('https://kato/123', 'kato')
    .then(function(ref) {
      test.equal(ref.name(), api.createHashCode('https://kato/123'));
    })
    .fin(test.done);
};

exports.testCreateAccount_valid = function(test) {
  test.expect(1);
  api.createAccount({uid: 'chuck', displayName: 'Chuck Norris', email: 'chuck@firebase.com', thirdPartyUserData: { picture: 'http://goo.gl/60YKZ2' }})
    .then(function(ref) {
      test.equal(ref.name(), 'chuck');
    })
    .fin(test.done)
    .done();
};

exports.testCreateAccount_invalid_email = function(test) {
  test.expect(1);
  api.createAccount({uid: 'chuck', displayName: 'Chuck Norris', email: 'chuck@norris.com', thirdPartyUserData: { picture: 'http://goo.gl/60YKZ2' }})
    .catch(function(err) {
      test.equal(err, 'invalid_email');
    })
    .fin(test.done)
    .done();
};

(function(exports) {
  // firebase is holding open connections. the rest of this
  // just ends the process
  var total = 0, expectCount = countTests(exports);
  exports.tearDown = function(done) {
    if( ++total === expectCount ) {
      setTimeout(function() {
        process.exit();
      }, 500);
    }
    done();
  };

  function countTests(exports) {
    var count = 0;
    for(var key in exports) {
      if( key.match(/^test/) ) {
        count++;
      }
    }
    return count;
  }
})(exports);
