function onOpen() {
  console.log('here');

  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    console.log(tabs[0]);
    var url = tabs[0].url;
    console.log(url);

    if(url.match("stackoverflow.com/questions/[0-9]+/")) {
      console.log("match");
      chrome.tabs.executeScript(null, { file: 'js/stackoverflow_parser.js' },
        function(result) {
          populateExtension(result);
        });
    }
  });
}

function populateExtension(results) {
  $("#input_summary").text(results[0].summary);
}

onOpen();