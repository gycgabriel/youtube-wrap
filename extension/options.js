$(document).ready(function() {

  chrome.storage.sync.get(
    {isDebugMode: false},
    function(items) {
      $('#debug').prop('checked', items.isDebugMode);

      $('#debug').change(function() {
        chrome.storage.sync.set({isDebugMode: this.checked});
      });
    }
  );

});