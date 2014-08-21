//
//// Called when the user clicks on the browser action.
//chrome.browserAction.onClicked.addListener(function(tab) {
//  // No tabs or host permissions needed!
//  console.log('Turning ' + tab.url + ' red!');
//  chrome.tabs.executeScript({
//    code: 'document.body.style.backgroundColor="red"'
//  });
//});
//
//
////chrome.runtime.onInstalled.addListener(function() {
////  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
////    chrome.declarativeContent.onPageChanged.addRules([
////      {
////        conditions: [
////          new chrome.declarativeContent.PageStateMatcher({
////            pageUrl: {
////              hostEquals: 'stackoverflow.com',
////              urlMatches: 'stackoverflow.com/questions/[0-9]+/'}
////          })
////        ],
////        actions: [new chrome.declarativeContent.ShowPageAction()]
////      },
////      {
////        conditions: [
////          new chrome.declarativeContent.PageStateMatcher({
////            pageUrl: {
////              hostEquals: 'firebase.desk.com',
////              pathContains: '/web/agent/case/'
////            }
////          })
////        ],
////        actions: [new chrome.declarativeContent.ShowPageAction()]
////      },
////      {
////        conditions: [
////          new chrome.declarativeContent.PageStateMatcher({
////            pageUrl: {
////              hostEquals: 'groups.google.com',
////              urlContains: '/forum/'
////
////            }
////          })
////        ],
////        actions: [new chrome.declarativeContent.ShowPageAction()]
////      }
////
////    ]);
////  });
////});
