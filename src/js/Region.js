var Region = (function (JSTACK) {
    "use strict";

    var selectedRegions;

    function getCurrentRegions () {
        if (!selectedRegions || selectedRegions.length === 0) {
            selectedRegions = ["Spain2"];
        }
        return selectedRegions;
    }

    function getAvailableRegions () {

        var availableRegions = [];
        var region;

        JSTACK.Keystone.params.access.serviceCatalog.forEach(function (endpointList) {
            endpointList.endpoints.forEach(function (endpoint) {
                region = endpoint.region;
                if (availableRegions.indexOf(region) === -1) {
                    availableRegions.push(region);
                }
            });
        });

        //availableRegions.push('Platform region');

        return availableRegions;
    }

    function setCurrentRegions (containerUI) {
        var regionList = $('input[type=checkbox]:checked', containerUI);

        selectedRegions = [];
        regionList.each(function (index, element) {
            selectedRegions.push(element.value);
        });
    }

    return {
        getCurrentRegions: getCurrentRegions,
        getAvailableRegions: getAvailableRegions,
        setCurrentRegions: setCurrentRegions
    };
})(JSTACK);