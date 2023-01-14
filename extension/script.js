$(document).ready(function() {
    console.log('GAHAHAHAHAHA');
    console.log(ytcfg.data_);
    console.log(ytcfg.data_.INNERTUBE_CONTEXT_CLIENT_NAME);

    if (typeof ytcfg.data_.INNERTUBE_CONTEXT_CLIENT_NAME !== 'undefined') document.body.setAttribute('data-INNERTUBE_CONTEXT_CLIENT_NAME', JSON.stringify(ytcfg.data_.INNERTUBE_CONTEXT_CLIENT_NAME));
    if (typeof ytcfg.data_.INNERTUBE_CONTEXT_CLIENT_VERSION !== 'undefined') document.body.setAttribute('data-INNERTUBE_CONTEXT_CLIENT_VERSION', JSON.stringify(ytcfg.data_.INNERTUBE_CONTEXT_CLIENT_VERSION));
    if (typeof ytcfg.data_.DEVICE !== 'undefined') document.body.setAttribute('data-DEVICE', JSON.stringify(ytcfg.data_.DEVICE));
    if (typeof ytcfg.data_.ID_TOKEN !== 'undefined') document.body.setAttribute('data-ID_TOKEN', JSON.stringify(ytcfg.data_.ID_TOKEN));
    if (typeof ytcfg.data_.PAGE_CL !== 'undefined') document.body.setAttribute('data-PAGE_CL', JSON.stringify(ytcfg.data_.PAGE_CL));
    if (typeof ytcfg.data_.PAGE_BUILD_LABEL !== 'undefined') document.body.setAttribute('data-PAGE_BUILD_LABEL', JSON.stringify(ytcfg.data_.PAGE_BUILD_LABEL));
    if (typeof ytcfg.data_.VARIANTS_CHECKSUM !== 'undefined') document.body.setAttribute('data-VARIANTS_CHECKSUM', JSON.stringify(ytcfg.data_.VARIANTS_CHECKSUM));
});
