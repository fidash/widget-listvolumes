/* global Utils,UI,Region,OStackAuth */

var OpenStackListVolume = (function (JSTACK) {
    "use strict";

    var authURL = 'https://cloud.lab.fiware.org/keystone/v3/auth/';

    function createWidgetUI (tokenResponse) {
        /* jshint validthis: true */
        var token = tokenResponse.getHeader('x-subject-token');
        var responseBody = JSON.parse(tokenResponse.responseText);

        // Temporal change to fix catalog name
        responseBody.token.serviceCatalog = responseBody.token.catalog;

        // Mimic JSTACK.Keystone.authenticate behavior on success
        JSTACK.Keystone.params.token = token;
        JSTACK.Keystone.params.access = responseBody.token;
        JSTACK.Keystone.params.currentstate = 2;

        UI.stopLoadingAnimation($('.loading'));
        UI.createTable(getVolumeList.bind(this), createVolume);
        getVolumeList.call(this, true);

    }

    function handlePreferences () {
        /* jshint validthis: true */
        this.mintime = MashupPlatform.prefs.get("mintime") * 1000;
        this.maxtime = MashupPlatform.prefs.get("maxtime") * 1000;

        UI.updateHiddenColumns();
    }

    function authenticate () {
        /* jshint validthis: true */

        JSTACK.Keystone.init(authURL);
        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        /* jshint validthis: true */
        MashupPlatform.wiring.registerCallback("authentication", function(paramsraw) {
            var params = JSON.parse(paramsraw);
            var token = params.token;
            var responseBody = params.body;

            if (token === this.token) {
                // same token, ignore
                return;
            }

            // Mimic JSTACK.Keystone.authenticate behavior on success
            JSTACK.Keystone.params.token = token;
            JSTACK.Keystone.params.access = responseBody.token;
            JSTACK.Keystone.params.currentstate = 2;

            this.token = token;
            this.body = responseBody;

            // extra
            UI.stopLoadingAnimation($('.loading'));
            UI.createTable(getVolumeList.bind(this), createVolume);
            getVolumeList.call(this, true);
        }.bind(this));
    }

    function createJoinRegions (regionsLimit, autoRefresh) {
        /* jshint validthis: true */

        var currentVolumeList = [];
        var errorList = [];

        function deductRegionLimit () {

            regionsLimit -= 1;

            if (regionsLimit === 0) {

                UI.drawVolumes(getVolumeList.bind(this), autoRefresh, currentVolumeList);
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

            deductRegionLimit.call(this);
            UI.deactivateProgressBar();
        }

        function joinRegionsErrors (region, error) {

            error.region = region;
            errorList.push(error);

            deductRegionLimit.call(this);
            UI.deactivateProgressBar();
        }

        return {
            success: joinRegionsSuccess.bind(this),
            error: joinRegionsErrors.bind(this)
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
        /* jshint validthis: true */

        var regions = Region.getCurrentRegions();
        UI.activateProgressBar();

        if (regions.length === 0) {
            UI.clearTable();
        }
        else {
            var joinRegions = createJoinRegions(regions.length, autoRefresh);

            regions.forEach(function (region) {
                JSTACK.Cinder.getvolumelist(true, joinRegions.success.bind(this, region), joinRegions.error.bind(this, region), region);
            });
        }
        if (autoRefresh) {
            setTimeout(getVolumeList.bind(this, autoRefresh), this.maxtime);
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

    // function authError (error) {
    //     error = error.error;
    //     onError({message: error.code + " " + error.title, body: error.message, region: "IDM"});
    //     authenticate();
    // }

    function init () {
        /* jshint validthis: true */

        handlePreferences.call(this);

        MashupPlatform.prefs.registerCallback(handlePreferences.bind(this));
        MashupPlatform.wiring.registerCallback("regions", function(regionsraw) {
            UI.toggleManyRegions(JSON.parse(regionsraw));
            getVolumeList.call(this);
        });
    }

    function OpenStackListVolume () {

        this.init = init;
        this.authenticate = authenticate;
        this.listVolume = getVolumeList;
        this.createVolume = createVolume;
        this.mintime = 2000;
        this.maxtime = 30000;

    }

    return OpenStackListVolume;
})(JSTACK);
