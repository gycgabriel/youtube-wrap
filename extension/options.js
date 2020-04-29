$(document).ready(function() {

  chrome.storage.sync.get(
    {
      isDebugMode: false,
      maxScannedViews: 3000
    },
    function(items) {
      $('#isDebugMode').prop('checked', items.isDebugMode);
      $('#isDebugMode').change(function() {
        chrome.storage.sync.set({isDebugMode: this.checked});
      });

      $('#maxScannedViews').val(items.maxScannedViews);
      $('#maxScannedViews').change(function() {
        chrome.storage.sync.set({maxScannedViews: this.value});
      });
    }
  );

});