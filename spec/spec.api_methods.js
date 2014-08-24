var Firebase = require('firebase');
var api = require('../extension/js/api.js');
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

exports.testCreateTrend_valid = function(test) {
  test.expect(1);
  api.createTrend('short-name', 'Not so short name')
    .then(function(ref) {
      test.equal(ref.name(), 'short-name');
    })
    .fin(test.done)
    .done();
};

exports.testCreateTrend_exists = function(test) {
  test.expect(1);
  api.createTrend('wants-keyboard', 'wants a keyboard')
    .catch(function(e) {
      test.equal(e, 'already_exists');
    })
    .fin(test.done)
    .done();
};

exports.testCreateTrend_addsTags = function(test) {
  test.expect(2);
  api.createTrend('new-trend', 'A new trend', ['alpha', 'bravo'])
    .then(function() {
      api.createRef('tags/alpha/new-trend').once('value', function(snap) {
        test.equal(snap.val(), true, 'Creates tags/alpha');
        api.createRef('tags/bravo/new-trend').once('value', function(snap) {
          test.equal(snap.val(), true, 'Creates tags/bravo');
          test.done();
        });
      });
    })
    .catch(test.done)
    .done();
};

exports.testAddEntry_entryCreated = function(test) {
  test.expect(3);
  api.addEntry('broken-code', 'kato', 'http://kato.com/1')
    .then(function(ref) {
      api.createRef('entries/broken-code/'+ref.name()).once('value', function(snap) {
        var dat = snap.val()||{};
        test.ok(snap.val() !== null, 'entry exists');
        test.equal(dat.userid, 'kato');
        test.equal(dat.source, 'http://kato.com/1');
        test.done();
      }, test.ok.bind(test, false));
    });
};

exports.testAddEntry_incrementsCounter = function(test) {
  test.expect(2);
  var orig;
  var counterRef = api.createRef('trends/broken-code/count');
  counterRef.once('value', function(snap) {
    orig = snap.val();
    test.ok(orig !== null, 'counter exists');
    api.addEntry('broken-code', 'kato', 'http://kato.com/1')
      .then(function(ref) {
        counterRef.once('value', function(snap) {
          test.equal(snap.val(), orig + 1, 'counter incremented by 1');
          test.done();
        })
        .done();
      }, test.ok.bind(test, false));
  });
};

exports.testAddEntry_hasPriority = function(test) {
  test.expect(1);
  api.addEntry('broken-code', 'kato', 'http://kato.com/2')
    .then(function(ref) {
      ref.once('value', function(snap) {
        test.ok(snap.getPriority() > 0, 'has a priority');
        test.done();
      });
    })
    .done();
};

//todo exports.testAddEntry_nodups = function(test) {};

//exports.testGetOwner = function(test) {
//  test.expect(1);
//  api.getOwner('https://github.com/firebase/angularfire/issues/386')
//    .then(function(uid) {
//      test.equal(uid, 'kato');
//    })
//    .fin(test.done)
//    .done();
//};

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

exports.testAddTags = function(test) {
  test.expect(2);
  api.addTags('broken-code', ['alpha', 'bravo'])
    .then(function() {
      api.createRef('tags/alpha/broken-code').once('value', function(snap) {
        test.equal(snap.val(), true, 'Creates tags/alpha');
        api.createRef('tags/bravo/broken-code').once('value', function(snap) {
          test.equal(snap.val(), true, 'Creates tags/bravo');
          test.done();
        });
      });
    })
    .catch(test.done)
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
