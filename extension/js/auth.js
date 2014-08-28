var firebaseAuthToken = "";
var firebaseUid = "";
var intervalId = null;
var checker = function() {
  firebaseAuthToken = $('#firebaseAuthToken').text();
  firebaseUid = $('#firebaseUid').text();

  if(firebaseAuthToken != '') {
    chrome.storage.local.set({firebaseAuthToken: firebaseAuthToken, firebaseUid: firebaseUid});
    clearTimeout(intervalId);
    window.close();
  }
};

intervalId = setTimeout(checker, 1000);

