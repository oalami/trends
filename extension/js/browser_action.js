var authClient = null;
var ref = new Firebase("https://trends.firebaseio.com");
var currentUserId = null;
var documentUrl = null;

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
    $('#input_summary').on('keyup change blur paste', summaryChanged);
    $('#login').prop('disabled', true).text('logged in');
    $('#similar-trends').on('click', '[data-event="plusOne"]', addEntry);
    $('[data-target],[data-event]').prop('disabled', false);
    chrome.tabs.getSelected(null, function(tab) {
      var url = documentUrl = tab.url;

      $('#input_url').val(url);

      if(url.match("stackoverflow.com/questions/[0-9]+/")) {
        chrome.tabs.executeScript(null, { file: 'js/stackoverflow_parser.js' }, populateExtension);
      }

      $('[data-target]').click(openView);
      $('form[data-event="addTrend"]').submit(addTrend);
      var $button = $('[data-event="ownThis"]');
      watchOwnership($button, url);
      $button.click(ownPage.bind(null, $button, url));
      watchUrlEntry(url);
    });
  }

  getAuthToken();
}

function populateExtension(results) {
  var summary = results[0].summary;
  $("#input_summary").val(summary);
  $("#input_tags").val(results[0].tags.join(','));
  summaryChanged();
}

function summaryChanged() {
  populateShortName();
  updateTrendsSearch();
}

function populateShortName() {
  var summary = $('#input_summary').val();
  $('#input_shortname').val(api.createShortName(summary));
}

var currentSearch = null;
var updateTrendsSearch = $.debounce(500, function() {
  var msg;
  var $ul = $('#similar-trends').find('ul').first().empty();
  if( currentSearch ) {
    currentSearch.cancel();
  }
  var term = $('#input_summary').val();
  if( term ) {
    msg = 'loading...';
    currentSearch = api.createTrendsSearch(term);
    currentSearch.run()
      .then(applyTrendsSearch, function(err) {
        if( err !== 'canceled' ) {
          err(err);
        }
      });
  }
  else {
    msg = 'no results';
  }
  $ul.append('<li>'+msg+'</li>');
});

function applyTrendsSearch(hits) {
  currentSearch = null;
  var $sim = $('#similar-trends');
  var $urlList = $sim.find('ul').first().empty();
  if( !hits || !hits.length ) {
    $('<li>no results</li>').appendTo($urlList);
  }
  else {
    $.each(hits, function(i,v) {
      var $outerLi = $('<li></li>')
        .attr('data-id', v.id)
        .append('<button role="button" data-event="plusOne">+</button>')
        .append( $('<header></header>').text(v.summary + '(' + v.count + ')') )
        .appendTo( $urlList );
      if(v.entries && Object.keys(v.entries).length) {
        var $innerUl = $('<ul></ul>')
          .appendTo($outerLi);
        $.each(v.entries, function(k,e) {
          var $li = $('<li></li>').appendTo($innerUl);
          if(e.source && e.source.match(/^(http|www\.)/)) {
            var shortUrl = e.source.length > 40? e.source.substr(0, 40)+'...' : e.source;
            $('<a></a>')
              .attr('href', e.source)
              .attr('target', '_blank')
              .text(shortUrl)
              .attr('title', e.source)
              .appendTo($li);
          }
          else {
            $('<p></p>').text(e.source|| e.userid).appendTo($li);
          }
          if(e.comment) {
            $('<p></p>').text(e.comment).appendTo($li);
          }
        });
      }
    });
  }
}

function doLogin() {
  chrome.tabs.create({url: window.loginUrl});
}

function addEntry(e) {
  assertLoggedIn();
  e.preventDefault();
  var trendId = $(this).closest('[data-id]').attr('data-id');
  api.addEntry(trendId, currentUserId, documentUrl/*, comment */)
    .then(function() {
      msg('+1! URL added to trend')
    }, err);
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
  api.onOwnerChange(url, function(uid) {
    confirmSteal = false;
    $button.removeClass('owned by-me');
    if( uid ) {
      $button.data('owner', uid);
      if( uid === currentUserId ) {
        $button.prop('disabled', true).text('I own this');
      }
      else {
        api.getUser(uid).then(function(user) {
          $button.prop('disabled', false).addClass('owned').text('Steal from '+(user||{name: '<user not found>'}).name);
        });
      }
    }
    else {
      $button.prop('disabled', false).text('Own This');
    }
  })
}

function watchUrlEntry(url) {
  api.onEntryAdded(url, function() {
    $('[data-target="addTrend"]').prop('disabled', true).text('Added to trends');
    $('#similar-trends').addClass('exists');
  });
}

var confirmSteal = null;
function ownPage($button, url) {
  if( $button.hasClass('owned') && !confirmSteal ) {
    confirmSteal = true;
    $button.text('Click again to confirm');
    return;
  }
  assertLoggedIn();
  $button.prop('disabled', true);
  api.claimOwnership(url, currentUserId, confirmSteal? $button.data('owner') : null)
    .then(function() { msg('You own it now'); }, err);
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