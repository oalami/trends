(function(angular, config) {
  "use strict";

  var app = config.app();

  app.factory('$entries', function($base, $FirebaseArray, UsersRef, $q) {

    var EntriesFactory = $FirebaseArray.$extendFactory({

      // Return the user info and the entry as one object
      getUserInfo: function() {
        var deferreds = [];
        angular.forEach(this.$list, function(entry) {
          var deferred = $q.defer();

          UsersRef.child(entry.userid).once('value', function(snap) {
            var entryUser = {};
            angular.extend(entryUser, entry, snap.val());
            deferred.resolve(entryUser);
          });

          deferreds.push(deferred.promise);
        });
        return $q.all(deferreds);
      }
    });

    return function $entries (id) {
      return $base('/entries/' + id, { arrayFactory: EntriesFactory });
    };

  });

}(angular, config));
