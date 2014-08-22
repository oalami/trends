var firebaseAuthToken = "";
var intervalId = null;
var checker = function() {
  firebaseAuthToken = $('#firebaseAuthToken').text();

  if(firebaseAuthToken != '') {
    console.log('setting authToken ' + firebaseAuthToken);
    chrome.storage.local.set({firebaseAuthToken: firebaseAuthToken});
    clearTimeout(intervalId)
  }
};

intervalId = setTimeout(checker, 1000);

