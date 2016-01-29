/* global Utils,UI,Region,OStackAuth */

var OpenStackListVolume = (function (JSTACK) {
    "use strict";

    var authURL = 'https://cloud.lab.fiware.org/keystone/v3/auth/';

    function createWidgetUI (tokenResponse) {

        var token = tokenResponse.getHeader('x-subject-token');
        var responseBody = JSON.parse(tokenResponse.responseText);

        // Temporal change to fix catalog name
        responseBody.token.serviceCatalog = responseBody.token.catalog;

        // Mimic JSTACK.Keystone.authenticate behavior on success
        JSTACK.Keystone.params.token = token;
        JSTACK.Keystone.params.access = responseBody.token;
        JSTACK.Keystone.params.currentstate = 2;

        UI.stopLoadingAnimation($('.loading'));
        UI.createTable(getVolumeList, createVolume);
        getVolumeList(true);

    }

    function handlePreferences () {
        UI.updateHiddenColumns();
    }

    function authenticate () {
        JSTACK.Keystone.init(authURL);
        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        OStackAuth.getTokenAndParams(OStackAuth.CLOUD_URL)
            .then(function (params) {
                var token = params.token;
                var response = params.response;
                var responseBody = JSON.parse(response.responseText);
                // Temporal change to fix catalog name
                responseBody.token.serviceCatalog = responseBody.token.catalog;
                // Mimic JSTACK.Keystone.authenticate behavior on success
                JSTACK.Keystone.params.token = token;
                JSTACK.Keystone.params.access = responseBody.token;
                JSTACK.Keystone.params.currentstate = 2;
                // MORE

                UI.stopLoadingAnimation($('.loading'));
                UI.createTable(getVolumeList, createVolume);
                getVolumeList(true);
            })
            .catch(function(error) {
                authError({
                    error: {
                        code: error.status,
                        title: "Error",
                        message: error.statusText
                    }
                });
            });


    }

    function createJoinRegions (regionsLimit, autoRefresh) {

        var currentVolumeList = [];
        var errorList = [];

        function deductRegionLimit () {

            regionsLimit -= 1;

            if (regionsLimit === 0) {

                UI.drawVolumes(getVolumeList, autoRefresh, currentVolumeList);
                drawErrors();
            }
        }

        function drawErrors () {
            if (errorList.length === 0) return;

            errorList.forEach(function (error) {
                onError(error);
            });
        }

        function joinRegionsSuccess (region, volumeList) {

            volumeList.volumes.forEach(function (volume) {
                volume.region = region;
                currentVolumeList.push(volume);
            });

            deductRegionLimit();
        }

        function joinRegionsErrors (region, error) {

            error.region = region;
            errorList.push(error);

            deductRegionLimit();
        }

        return {
            success: joinRegionsSuccess,
            error: joinRegionsErrors
        };
    }

    function createVolume () {

        var size = $('#id_size').val();
        var description = $('#id_description').val();
        var name = $('#id_name').val();
        var region = $('#id_region').find(":selected").val();

        JSTACK.Cinder.createvolume(size, name, description, createVolumeCallback, onError, region);

        // Clear form inputs
        $('#id_size').val('1');
        $('#id_description').val('');
        $('#id_name').val('');

        // Hide modal
        $('#createVolumeModal').modal('hide');
    }

    function createVolumeCallback (response) {

        // Show success message
        console.log("Volume successfully created");
    }

    function getVolumeList (autoRefresh) {

        var regions = Region.getCurrentRegions();

        if (regions.length === 0) {
            UI.clearTable();

            // Keep refreshing even if there are no regions selected
            if (autoRefresh) {
                setTimeout(function () {
                    getVolumeList(autoRefresh);
                }, 4000);
            }
        }
        else {
            var joinRegions = createJoinRegions(regions.length, autoRefresh);

            regions.forEach(function (region) {
                JSTACK.Cinder.getvolumelist(true, joinRegions.success.bind(null, region), joinRegions.error.bind(null, region), region);
            });
        }
    }

    function onError (error) {

        var errors = {
            '500 Error': 'An error has occurred on the server side.',
            '503 Error': 'Cloud service is not available at the moment.'
        };

        if (error.message in errors) {
            Utils.createAlert('danger', 'Error', errors[error.message], error);
        }
        else {
            Utils.createAlert('danger', error.message, error.body);
        }

        console.log('Error: ' + JSON.stringify(error));
    }

    function authError (error) {
        error = error.error;
        onError({message: error.code + " " + error.title, body: error.message, region: "IDM"});
        authenticate();
    }

    function init () {
        handlePreferences();
        MashupPlatform.prefs.registerCallback(handlePreferences);
        MashupPlatform.wiring.registerCallback("regions", function(regionsraw) {
            UI.toggleManyRegions(JSON.parse(regionsraw));
        });
    }

    function OpenStackListVolume () {

        this.init = init;
        this.authenticate = authenticate;
        this.listVolume = getVolumeList;
        this.createVolume = createVolume;

    }

    return OpenStackListVolume;
})(JSTACK);
