var authClient = null;
var ref = new Firebase("https://trends.firebaseio.com");
var currentUserId = null;

chrome.storage.local.remove(["firebaseAuthToken", "firebaseUid"]);

function onOpen($) {
  var handleAuthTokenGet = function(items) {
    var authToken = items.firebaseAuthToken;
    if(authToken === null || authToken === '') {
      $('#login').click(doLogin);
      chrome.storage.onChanged.addListener(function(changes, areaName) {
        chrome.storage.local.get({"firebaseAuthToken": null, "firebaseUid": null}, handleAuthTokenGet);
      });
    } else {
      currentUserId = items.firebaseUid;
      ref.auth(authToken, function(err) {
        if( err ) { err(err); }
        else { initPageEvents(); }
      });
    }
  };

  var getAuthToken = function() {
    //todo-hack ossama: I broke the login page
    handleAuthTokenGet({
      firebaseAuthToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2NjU0NDc4ODMsInYiOjAsImQiOnsiaWQiOiIxMDE4MzQzNDc0Mjg0NDQ0ODAyOTQiLCJ1aWQiOiJnb29nbGU6MTAxODM0MzQ3NDI4NDQ0NDgwMjk0IiwicHJvdmlkZXIiOiJnb29nbGUiLCJlbWFpbCI6Ind1bGZAZmlyZWJhc2UuY29tIn0sImlhdCI6MTQwODgzOTg4M30.96mmlRwozvKfpgSvCFsHFlnso6DPg8Qv1gYQ4h6FaZU',
      firebaseUid: 'google:101834347428444480294'
    });
//    chrome.storage.local.get({"firebaseAuthToken": null, "firebaseUid": null}, handleAuthTokenGet);
  };

  function initPageEvents() {
    $('#login').prop('disabled', true).text('logged in');
    $('[data-target]').prop('disabled', false);
    chrome.tabs.getSelected(null, function(tab) {
      var url = tab.url;

      $('#input_url').val(url);

      if(url.match("stackoverflow.com/questions/[0-9]+/")) {
        chrome.tabs.executeScript(null, { file: 'js/stackoverflow_parser.js' }, populateExtension);
      }

      $('#input_summary').on('keyup change blur paste', populateShortName);
      $('[data-target]').click(openView);
      $('form[data-event="addTrend"]').submit(addTrend);
      var $button = $('[data-target="ownThis"]');
      watchOwnership($button, url);
      $button.click(ownPage.bind(null, url));
    });
  }

  getAuthToken();
}

function populateExtension(results) {
  var summary = results[0].summary;
  $("#input_summary").val(summary);
  $("#input_tags").val(results[0].tags.join(','));
  populateShortName();
}

function populateShortName() {
  var summary = $('#input_summary').val();
  $('#input_shortname').val(api.createShortName(summary));
}

function doLogin() {
  chrome.tabs.create({url: window.loginUrl});
}

function addTrend(e) {
  assertLoggedIn();
  e.preventDefault();
  var summary = $('#input_summary').val().trim();
  var tags = $('#input_tags').val().split(/\s*,\s*/);
  var shortName = $('#input_shortname').val().trim();
  var url = $('#input_url').val().trim();
  if( summary && shortName && tags && url ) {
    api.createTrend(shortName, summary, tags)
      .then(function() {
        return api.addEntry(shortName, currentUserId, url);
      })
      .then(function() {
        $('[data-target="home"]').click();
        msg('Added new trend "'+shortName+'"');
      })
      .catch(err)
      .done();
  }
  else {
    console.error('Missing required fields', {summary: summary, shortName: shortName, tags: tags, url: url});
    alert('Please enter all fields');
  }
}

function watchOwnership($button, url) {
  assertLoggedIn();
  api.onOwnerChange(url, function(owner) {
    if( owner ) {
      $button.prop('disabled', true).text('<owned by '+owner+'>');
      $('[data-view="ownThis"] p').text('Owned by '+owner);
    }
    else {
      $button.prop('disabled', false).text('Own This');
      $('[data-view="ownThis"] p').text('Claiming...');
    }
  })
}

function ownPage(url) {
  assertLoggedIn();
}

function openView() {
  $('[data-view]').addClass('hide');
  var openedView = $(this).attr('data-target');
  $('[data-event="all-views"]').toggleClass('hide', openedView === 'home');
  $('[data-view="' + openedView + '"]').removeClass('hide');
}

function assertLoggedIn() {
  if( !currentUserId ) {
    throw new Error('Must be logged in to call this method');
  }
}

function err(err) {
  msg(err, 'error');
}

function msg(msg, style) {
  $('<li></li>').text(msg).addClass(style||'success').appendTo('#messages');
}

jQuery(onOpen);