var firebaseAuthToken = "";
var firebaseUid = "";
var intervalId = null;
var checker = function() {
  firebaseAuthToken = $('#firebaseAuthToken').text();
  firebaseUid = $('#firebaseUid').text();

  if(firebaseAuthToken != '') {
    console.log('setting uid ' + firebaseUid);
    console.log('setting authToken ' + firebaseAuthToken);
    chrome.storage.local.set({firebaseAuthToken: firebaseAuthToken, firebaseUid: firebaseUid});
    clearTimeout(intervalId);
  }
};

intervalId = setTimeout(checker, 1000);