var ref = new Firebase("https://trends.firebaseio.com");
var currentUserId = null;
var documentUrl = null;
var sessionName = "firebase:session::trends";

function onOpen($) {
  function handleAuthDataChanged(authToken, uid) {
    if(authToken && uid && authToken != '' && uid != '') {
      $("#login").prop("disabled",true);
      $("#login").text("logging in...");
      currentUserId = uid;
      ref.authWithCustomToken(authToken, function(err, authData) {
        if( err ) {
          chrome.storage.local.remove([sessionName]);
          err(err);
        }
        else {
          initPageEvents();
          $("#login").prop("disabled",false);
          $("#login").hide();
        }
      });
    }
  }

  function initAuthEvents() {
    $('#login').click(function() {
      chrome.tabs.create({url: window.loginUrl});
    });

    chrome.storage.local.get([sessionName], function(items) {
      var authToken = items.firebaseAuthToken || null;
      var uid = items.firebaseUid || null;
      handleAuthDataChanged(authToken, uid);
    });

    chrome.storage.onChanged.addListener(function(changes, namespace) {
      handleAuthDataChanged(changes.firebaseAuthToken.newValue, changes.firebaseUid.newValue);
    });
  }

  function initPageEvents() {
    $('#input_summary').on('keyup change blur paste', summaryChanged);
    $('#similar-trends').on('click', '[data-event="plusOne"]', addEntry);
    $('[data-target],[data-event]').prop('disabled', false);
    chrome.tabs.getSelected(null, function(tab) {
      var url = documentUrl = tab.url;

      $('#input_url').val(url);

      if(url.match("stackoverflow.com/questions/[0-9]+/")) {
        chrome.tabs.executeScript(null, { file: 'js/parsers/stackoverflow.js' }, populateExtension);
      } else if(url.match("https://firebase.desk.com/web/agent/case/[0-9]+")) {
        chrome.tabs.executeScript(null, { file: 'js/parsers/new_desk.js' }, populateExtension);
      } else if(url.match("https://firebase.desk.com/agent")) {
        chrome.tabs.executeScript(null, { file: 'js/parsers/desk.js' }, populateExtension);
      } else if(url.match("https://groups.google.com/forum/#!topic/.+/.+")) {
        chrome.tabs.executeScript(null, { file: 'js/parsers/groups.js' }, populateExtension);
      } else if(url.match("https://twitter.com/.+/status/[0-9]+")) {
        chrome.tabs.executeScript(null, { file: 'js/parsers/twitter.js' }, populateExtension);
      } else {
        populateExtension([{summary: tab.title}]);
      }

      $('[data-target]').click(openView);
      $('form[data-event="addTrend"]').submit(addTrend);
      var $button = $('[data-event="ownThis"]');
      watchOwnership($button, url);
      $button.click(ownPage.bind(null, $button, url));
      watchUrlEntry(url);
      updateTrendsSearch();
    });
  }

  initAuthEvents();
}

function populateExtension(results) {
  var result = results[0];
  var summary = result.summary;
  $("#input_summary").val(summary);
  if(result.tags) {
    $("#input_tags").val(result.tags.join(','));
  } else {
    $("#input_tags").val();
  }
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
  var $ul = $('#similar-trends').find('ul').empty();
  if( currentSearch ) {
    currentSearch.cancel();
  }
  var term = $('#input_summary').val();
  console.log('search term', term); //debug
  if( term ) {
    msg = 'loading...';
    currentSearch = api.createTrendsSearch(term);
    currentSearch.run()
      .then(applyTrendsSearch, function(err) {
        console.log('search error', err); //debug
        if( err !== 'canceled' ) {
          $ul.empty().append('<li>'+err+'</li>');
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
  console.log('applyTrendsSearch', hits); //debugs
  currentSearch = null;
  var $urlList = $('#similar-trends').find('ul').empty();
  if( !hits || !hits.length ) {
    $('<li></li>').text('no results').appendTo($urlList);
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