$("body").append("<p>test</p>");
function onOpen() {
  $("body").append("<p>woooooo</p>");
  console.log('log log');
  chrome.tabs.executeScript(null, { file: 'js/stackoverflow_parser.js' },
    function(result) {
      populateExtension(result);
    });
}

function populateExtension(result) {
  $("body").append(result.summary);
}

onOpen();






//Firebase.enableLogging(true);
//var f = new Firebase('https://chrome-sample.firebaseio-demo.com/');
//
//f.transaction(function(curr) {
//  if (isNaN(parseFloat(curr)))
//    return 1; // initialize to 1.
//  else
//    return curr + 1; // increment.
//}, function() {
//    // Once the transaction has completed, update the UI (and watch for updates).
//    f.on('value', function(s) {
//      document.getElementById('contents').innerHTML = s.val();
//    });
//  });
