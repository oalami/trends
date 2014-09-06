
chrome.tabs.onActivated.addListener(lookUpUrl);
chrome.tabs.onUpdated.addListener(lookUpUrl);
chrome.tabs.onCreated.addListener(lookUpUrl);

var currentUrl = null, subs = [];
function lookUpUrl() {
  chrome.tabs.getSelected(null, function(tab) {
    if(tab.url !== currentUrl && tab.url.match(/^http/)) {
      currentUrl = tab.url;
      subs.forEach(function(dispose) {
        dispose();
      });
      subs = [];
      api.getTrendForUrl(currentUrl)
        .then(function(trendId) {
          if( trendId !== null ) {
            subs.push(api.onTrendChange(trendId, trendChange));
          }
          else {
            trendChange({count: 0});
          }
        });
      subs.push(api.onOwnerChange(currentUrl, ownerChanged));
    }
  });
}

function ownerChanged(owner) {
  var color = owner === null? [190, 190, 190, 190] : [10, 190, 50, 230];
  chrome.browserAction.setBadgeBackgroundColor({color: color});
}

function trendChange(trend) {
  chrome.browserAction.setBadgeText({text: trend.count + ''});
}