$(document).ready(function() {

  var config = {
    isDebugMode: false,
    maxScannedViews: 3000
  };
  var isWatchHistory = false;
  var maxChartsSize = 20;
  var initialChartsSize = 3;

  chrome.storage.sync.get(
    config,
    function(items) {
      config = items;
      log('debug mode enabled');
    }
  );

  function log(...args) {
    if (config.isDebugMode) {
      console.log('YouTube Charts:', ...args);
    }
  }

  // Called on a regular timer to detect whether we entered or left the
  // watch history. The desktop YouTube web app does not load a new page
  // when navigating to the watch history from many places. It presumably
  // changes browser history via JS which the Chrome extension API has no
  // hooks for (?). Polling for the URL and presence of elements we know
  // to exist in the watch history seems the least brittle approach,
  // though possibly inefficient.
  function detectWatchHistory() {
    if (location.pathname == '/feed/history') {
      var historyContainer = $('[page-subtype=history][role=main]');
      // Waiting for some videos to render because otherwise the page might
      // delete our container again - or we might be looking at the history
      // being signed out.
      var hasVideos = historyContainer.find("#video-title").length;
      if (hasVideos && !isWatchHistory) {
        isWatchHistory = true;
        log('detected watch history');
        onWatchHistoryDetected(historyContainer);
      }
    } else {
      if (isWatchHistory) {
        log('detected leaving watch history');
      }
      isWatchHistory = false;
    }
  }

  // Called each time we detected that we have navigated to the watch
  // history.
  function onWatchHistoryDetected(container) {
    log('Hi its me');

    var chartsContainer = renderChartsContainer(container);

    scanWatchHistory(
      function(viewCounts) {
        log('Scan completed');
        var charts = Object.values(viewCounts);
        charts.sort(function(a, b) { return b.views - a.views; });
        charts = charts.slice(0, maxChartsSize);
        log('Charts:', charts);
        renderCharts(chartsContainer, charts);
      },
      function(errorMessage) {
        log('Scan error:', errorMessage);
        renderError(container, errorMessage);
      },
      function(viewsCount) {
        container.find('#yc-loading-progress').text(`${viewsCount}/${config.maxScannedViews} views`);
      }
    );

  }

  // Uses the undocumented watch history browse API to scan the watch history
  // as far back as possible or as configured.
  function scanWatchHistory(callback, errorCallback, progressCallback) {
    var ytConfig = getYtConfigValues([
      "INNERTUBE_CONTEXT_CLIENT_NAME",
      "INNERTUBE_CONTEXT_CLIENT_VERSION",
      "DEVICE",
      "ID_TOKEN",
      "PAGE_CL",
      "PAGE_BUILD_LABEL",
      "VARIANTS_CHECKSUM"
    ]);
    log('YouTube config', ytConfig);

    // API responses will be empty (requesting a full page reload) without
    // some (all?) of these headers.
    var headers = {
      'x-youtube-client-name': ytConfig.INNERTUBE_CONTEXT_CLIENT_NAME,
      'x-youtube-client-version': ytConfig.INNERTUBE_CONTEXT_CLIENT_VERSION,
      'x-youtube-device': ytConfig.DEVICE,
      'x-youtube-identity-token': ytConfig.ID_TOKEN,
      'x-youtube-page-cl': ytConfig.PAGE_CL,
      'x-youtube-page-label': ytConfig.PAGE_BUILD_LABEL,
      'x-youtube-variants-checksum': ytConfig.VARIANTS_CHECKSUM
    };

    var viewCounts = {};
    var viewsScannedCount = 0;

    function continueScanning(continuationData) {
      var isContinuation = !!continuationData;
      var url = isContinuation ? "https://www.youtube.com/browse_ajax" : "https://www.youtube.com/feed/history?pbj=1";
      var queryParams = isContinuation ? {
        continuation: continuationData.continuation,
        ctoken: continuationData.continuation,
        itct: continuationData.clickTrackingParams
      } : null;

      $.get({
        url: url,
        data: queryParams,
        dataType: "json",
        headers: headers
      })
      .done(function(json) {
        if (!isWatchHistory) {
          return errorCallback('No watch history detected');
        }

        var sectionList, sections;
        try {
          if (isContinuation) {
            sectionList = json[1].response.continuationContents.sectionListContinuation;
          } else {
            sectionList = json[1].response.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer;
          }
          sections = sectionList.contents;
        } catch (error) {
          errorCallback('Could not identify content in history scan response: ' + error);
          return;
        }

        var views;
        try {
          views = extractViewsFromSections(sections);
        } catch (error) {
          errorCallback('Could not identify view content in history: ' + error);
          return;
        }

        viewsScannedCount += views.length;
        if (viewsScannedCount > config.maxScannedViews) {
          views = views.slice(0, config.maxScannedViews - viewsScannedCount + views.length);
        }
        addViewCounts(viewCounts, views);
        log(`Scanned ${sections.length} sections with ${views.length} views`);
        progressCallback(viewsScannedCount);

        if (viewsScannedCount >= config.maxScannedViews) {
          callback(viewCounts);
          return;
        }

        var continuationData = null;
        try {
          if (sectionList.continuations) {
            continuationData = sectionList.continuations[0].nextContinuationData;
          }
        } catch (error) {
          errorCallback('Could not identify continuation in history scan response: ' + error);
          return;
        }

        if (continuationData) {
          continueScanning(continuationData);
        } else {
          callback(viewCounts);
        }
      })
      .fail(function() {
        errorCallback('History scan request failed');
      });
    }

    continueScanning(null);
  }

  // Turns a list of `itemSectionRenderer` from API responses into a list of views
  // with just the properties we care about:
  // - id
  // - title
  // - thumbnail
  // - byline (optional)
  function extractViewsFromSections(sections) {
    var views = [];
    sections.forEach(function(section) {
      section.itemSectionRenderer.contents.forEach(function(ytView) {
        var renderer = ytView.videoRenderer;
        try {
          var view = {
            id: renderer.videoId,
            title: renderer.title.runs[0].text,
            thumbnail: renderer.thumbnail.thumbnails[renderer.thumbnail.thumbnails.length - 1],
            byline: renderer.shortBylineText ? renderer.shortBylineText.runs[0].text : ''
          };
          views.push(view);
        } catch (error) {
          log('Failed to identify contents of view', ytView, error);
        }
      });
    });
    return views;
  }

  function addViewCounts(viewCounts, views) {
    views.forEach(function(view) {
      if (view.id in viewCounts) {
        viewCounts[view.id].views++;
      } else {
        view.views = 1;
        viewCounts[view.id] = view;
      }
    });
  }

  // Grab config values from the global "ytcfg" object via a script injection
  // hack (based on https://stackoverflow.com/a/37067217/1819351). We have to
  // read these selectively as there are properties in the object that can't
  // be stringified.
  function getYtConfigValues(configVariables) {
    var ret = {};

    var scriptContent = "";
    // scriptContent += "console.log(ytcfg);\n";
    scriptContent += "console.log('GAHAHAHAHAHA');\n";
    // for (var i = 0; i < configVariables.length; i++) {
    //   var currVariable = configVariables[i];
    //   scriptContent += "if (typeof ytcfg.data_." + currVariable + " !== 'undefined') document.body.setAttribute('data-" + currVariable + "', JSON.stringify(ytcfg.data_." + currVariable + "));\n"
    // }

    // Method 1: https://stackoverflow.com/a/9517879
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL('script.js');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);
    log(script);

    for (var i = 0; i < configVariables.length; i++) {
      let currVariable = configVariables[i];
      log(currVariable);
      log(JSON.stringify(ytcfg.data_.INNERTUBE_CONTEXT_CLIENT_NAME));
      let t = "data-" + currVariable;
      document.body.setAttribute(t, "HAHA");
      log($("body").attr("data-" + currVariable));
      ret[currVariable] = JSON.parse($("body").attr("data-" + currVariable));
      $("body").removeAttr("data-" + currVariable);
    }

    //$("#tmpScript").remove();

    return ret;
  }

  // Renders the container that will hold the charts, based off a copy of a section
  // container in the watch history.
  function renderChartsContainer(container) {
    container.find('yc-charts-container').remove();

    var firstContents = container.find("#contents").first().children().first();
    var chartsContainer = $(customDeepCloneNode(firstContents.get(0)));
    chartsContainer.attr('id', 'yc-charts-container');
    chartsContainer.find("#header #title").text('Personal Charts');
    var chartsContents = chartsContainer.find("#contents");
    chartsContents.html(`
      <div id="yc-loading-content">
        <div class="yc-loading-spinner"></div>
        <div class="yc-loading-note">
          Scanning your watch history...
          <span id="yc-loading-progress"></span>
        </div>
      </div>
      <div id="yc-initial-charts"></div>
      <div id="yc-rest-charts"></div>
      <div id="yc-charts-tools" style="display: none">
        By Personal YouTube Charts, based on the last ${config.maxScannedViews} views in your history.
        <a id="yc-tools-more" href="#" style="display: none">show more</a>
        <a id="yc-tools-less" href="#" style="display: none">show less</a>
        <span id="yc-charts-error"></span>
      </div>
    `);

    var more = chartsContents.find('#yc-tools-more');
    var less = chartsContents.find('#yc-tools-less');
    var restCharts = chartsContents.find('#yc-rest-charts');
    more.click(function(event) {
      event.preventDefault();
      restCharts.show();
      more.hide();
      less.show()
    });
    less.click(function(event) {
      event.preventDefault();
      restCharts.hide();
      less.hide()
      more.show();
    });

    firstContents.parent().prepend(chartsContainer);
    return chartsContainer;
  }

  // Renders the given charts within the given charts container. The individual charts
  // item use custom HTML that tries to mimic the video view within the watch history,
  // mixing some CSS from YT and some custom CSS.
  function renderCharts(chartsContainer, charts) {
    $('#yc-loading-content').hide();
    var initialChartsContents = chartsContainer.find('#yc-initial-charts');
    var restChartsContents = chartsContainer.find('#yc-rest-charts');
    restChartsContents.hide();

    charts.forEach(function(chartItem, index) {
      var itemElement = $(`
        <div id="dismissable" class="ytd-video-renderer yc-chart-item">
          <div class="yc-thumbnail">
            <a id="thumbnail" class="yt-simple-endpoint inline-block style-scope ytd-thumbnail">
              <img id="img" width="246" />
            </a>
          </div>
          <div class="text-wrapper ytd-video-renderer">
            <a id="video-title" class="yt-simple-endpoint ytd-video-renderer"></a>
            <div class="yc-meta-stuff">
              <span class="yc-byline"></span>
              •
              <span>Your views: <span class="yc-view-count"></span></span>
            </div>
          </div>
        </div>
      `);
      var watchUrl = "/watch?v=" + chartItem.id;
      var link = itemElement.find('#video-title');
      link.text(`#${index + 1}: ${chartItem.title}`);
      link.attr("href", watchUrl);
      itemElement.find('#thumbnail').attr("href", watchUrl);
      itemElement.find('#img').attr("src", chartItem.thumbnail.url);
      itemElement.find('.yc-byline').text(chartItem.byline);
      itemElement.find('.yc-view-count').text(chartItem.views);

      if (index < initialChartsSize) {
        initialChartsContents.append(itemElement);
      } else {
        restChartsContents.append(itemElement);
      }
    });

    chartsContainer.find('#yc-charts-tools').show();
    if (charts.length > initialChartsSize) {
      chartsContainer.find('#yc-tools-more').show();
    }
  }

  function renderError(container, errorMessage) {
    container.find('#yc-charts-error').text(`(Failed to load charts: ${errorMessage})`);
    container.find('#yc-loading-content').hide();
    container.find('#yc-charts-tools').show();
  }

  // Deep clones a DOM element while replacing all custom YT web component elements
  // with plain div elements. This gives an imperfect copy in terms of rendering and
  // behavior (all the web component logic is lost) but it's close enough for our
  // purposes. Using standard `cloneNode(true)` ignores all non-standard elements
  // (i.e. the web components that YT uses extensively).
  function customDeepCloneNode(node) {
    var cloned = null;
    if (node.nodeName.match(/^YT/)) {
      cloned = document.createElement('div');
      node.getAttributeNames().forEach(function(attributeName) {
        cloned.setAttribute(attributeName, node.getAttribute(attributeName));
      });
    } else {
      cloned = node.cloneNode();
    }

    if (node.children.length == 0) {
      cloned.textContent = node.textContent;
      return cloned;
    }

    cloned.innerHTML = '';
    for (var i = 0; i < node.children.length; i++) {
      cloned.appendChild(customDeepCloneNode(node.children[i], null));
    }
    return cloned;
  }

  setInterval(detectWatchHistory, 1000);
});