/* global OpenStackListVolume */

$(document).ready(function() {
    "use strict";

	var openStackListVolume = new OpenStackListVolume();

    openStackListVolume.init();
    openStackListVolume.authenticate();
});