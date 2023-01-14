import data from './content_script';
console.log('In script.js');
console.log(data);

// configVariables = [
//     "INNERTUBE_CONTEXT_CLIENT_NAME",
//     "INNERTUBE_CONTEXT_CLIENT_VERSION",
//     "DEVICE",
//     "ID_TOKEN",
//     "PAGE_CL",
//     "PAGE_BUILD_LABEL",
//     "VARIANTS_CHECKSUM"
// ];

// function getYtConfigValues() {
//     console.log('HELLO I AM HERE');
//     var ret = {};

//     var scriptContent = "";
//     for (var i = 0; i < configVariables.length; i++) {
//         var currVariable = configVariables[i];
//         scriptContent += "if (typeof ytcfg.data_." + currVariable + " !== 'undefined') document.body.setAttribute('data-" + currVariable + "', JSON.stringify(ytcfg.data_." + currVariable + "));\n"
//     }

//     var script = document.createElement('script');
//     script.id = 'tmpScript';
//     script.appendChild(document.createTextNode(scriptContent));
//     (document.body || document.head || document.documentElement).appendChild(script);

//     for (var i = 0; i < configVariables.length; i++) {
//         var currVariable = configVariables[i];
//         if (typeof currVariable !== 'undefined') {    // parse json cannot parse undefined
//         continue;
//         }
//         ret[currVariable] = $.parseJSON($("body").attr("data-" + currVariable));
//         $("body").removeAttr("data-" + currVariable);
//     }

//     $("#tmpScript").remove();

//     return ret;
// }

// getYtConfigValues();
