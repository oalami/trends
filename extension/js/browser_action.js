var authClient = null;
var ref = new Firebase("https://trends.firebaseio.com");

function onOpen() {
  var handleAuthTokenGet = function(items) {
    var authToken = items.firebaseAuthToken;
    if(authToken === null || authToken === '') {
      chrome.storage.onChanged.addListener(function(changes, areaName) {
        chrome.storage.local.get("firebaseAuthToken", handleAuthTokenGet);
      });
    } else {
      ref.auth(authToken);
      $('#login').text("logged in");
    }
  };

  var getAuthToken = function() {
    chrome.storage.local.get("firebaseAuthToken", handleAuthTokenGet);
  };

  getAuthToken();

  $('#login').click(doLogin);

  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var url = tabs[0].url;

    if(url.match("stackoverflow.com/questions/[0-9]+/")) {
      chrome.tabs.executeScript(null, { file: 'js/stackoverflow_parser.js' },
        function(results) {
          populateExtension(results);
        });
    }
  });
}

function populateExtension(results) {
  $("#input_summary").text(results[0].summary);
}

function doLogin() {
  chrome.tabs.create({url: "https://trends.firebaseapp.com/login.html"});
}

onOpen();