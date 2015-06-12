/* global OpenStackListVolume, spyOnEvent, MyStrategy, getJSONFixture */

describe('List Volume', function () {
    "use strict";

    var listVolumes = null;
    var respAuthenticate = null;
    var respVolumeList = null;
    var prefsValues;

    beforeEach(function() {

        JSTACK.Keystone = jasmine.createSpyObj("Keystone", ["init", "authenticate", "gettenants", "params"]);
        JSTACK.Cinder = jasmine.createSpyObj("Cinder", ["getvolumelist", "createvolume"]);

        // Load strategy
        MashupPlatform.setStrategy(new MyStrategy(), prefsValues);

        // Load fixtures
        jasmine.getFixtures().fixturesPath = 'base/src/test/fixtures/html';
        loadFixtures('defaultTemplate.html');
        jasmine.getJSONFixtures().fixturesPath = 'base/src/test/fixtures/json';
        respVolumeList = getJSONFixture('respVolumeList.json');
        respAuthenticate = getJSONFixture('respAuthenticate.json');
        respVolumeList = getJSONFixture('respVolumeList.json');

        // Create new volume
        listVolumes = new OpenStackListVolume();
        listVolumes.init();
    });


    /**************************************************************************/
    /*                  A U X I L I A R   F U N C T I O N S                   */
    /**************************************************************************/

    function callListVolume() {

        var createWidgetUI;
        listVolumes.authenticate();

        createWidgetUI = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onSuccess;
        respAuthenticate = {
            responseText: JSON.stringify(respAuthenticate),
            getHeader: function () {}
        };
        createWidgetUI(respAuthenticate);

    }

    function callAuthenticateWithError (error) {
        
        var authError;

        authError = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onFailure;
        authError(error);
    }

    function callListVolumeSuccessCallback (volumeList) {

        var callback = JSTACK.Cinder.getvolumelist.calls.mostRecent().args[1];
        
        callback(volumeList);

    }

    function callListVolumeErrorCallback (error) {

        var callback = JSTACK.Cinder.getvolumelist.calls.mostRecent().args[2];

        callback(error);
    }


    /**************************************************************************/
    /*                  F U N C T I O N A L I T Y   T E S T S                 */
    /**************************************************************************/

    it('should authenticate through wirecloud proxy', function() {

        callListVolume();

        expect(MashupPlatform.http.makeRequest.calls.count()).toBe(1);
        expect(JSTACK.Keystone.params.currentstate).toBe(2);

    });

    it('should have created a table with the received volumes', function () {

        callListVolume();
        callListVolumeSuccessCallback(respVolumeList);

        var rows = document.querySelectorAll('tbody > tr');

        expect(rows.length).toBeGreaterThan(0);
    });

    it('should call error callback for authenticate correctly', function () {
        
        var consoleSpy = spyOn(console, "log");

        callListVolume();
        callAuthenticateWithError('Test successful');
        expect(consoleSpy.calls.mostRecent().args[0]).toBe('Error: "Test successful"');
    });

    it('should call getserverlist 2 seconds after receiving the last update', function () {

        var expectedCount, callback;
        var setTimeoutSpy = spyOn(window, 'setTimeout');

        callListVolume();
        expectedCount = JSTACK.Cinder.getvolumelist.calls.count() + 1;
        callListVolumeSuccessCallback(respVolumeList);
        callback = setTimeout.calls.mostRecent().args[0];
        callback();

        expect(JSTACK.Cinder.getvolumelist.calls.count()).toEqual(expectedCount);
        expect(setTimeoutSpy).toHaveBeenCalledWith(jasmine.any(Function), 4000);
        
    });

    it('should call createVolume function when click event is triggered on the create image button', function () {

        var createButton = $("#create-volume");
        var spyEvent;

        callListVolume();
        callListVolumeSuccessCallback(respVolumeList);
        $('#id_name').val("VolumeName");
        spyEvent = spyOnEvent(createButton, 'click');
        createButton.trigger('click');

        expect('click').toHaveBeenTriggeredOn('#create-volume');
        expect(JSTACK.Cinder.createvolume).toHaveBeenCalledWith(
            jasmine.any(String),
            "VolumeName",
            jasmine.any(String),
            jasmine.any(Function),
            jasmine.any(Function),
            jasmine.any(String));

    });

    it('should call the create volume callback correctly', function () {
        var createButton = $("#create-volume");
        var logSpy = spyOn(console, "log");
        var createVolumeSuccessCallback;

        callListVolume();
        callListVolumeSuccessCallback(respVolumeList);
        createButton.trigger('click');
        createVolumeSuccessCallback = JSTACK.Cinder.createvolume.calls.mostRecent().args[3];
        createVolumeSuccessCallback();

        expect(logSpy).toHaveBeenCalledWith("Volume successfully created");
    });

    it('should show an error alert with the appropiate predefined' + 
       ' message and the received message body in the details', function () {

        var imageId = 'id';
        var error = {message: "500 Error", body: "Internal Server Error"};
        
        callListVolume();
        callListVolumeErrorCallback(error);
        
        expect($('.alert > strong').last().text()).toBe('Error ');
        expect($('.alert > span').last().text()).toBe('An error has occurred on the server side. ');
        expect($('.alert > div').last().text()).toBe(error.message + ' ' + error.body + ' ' + error.region + ' ');

    });

    it('should show an error alert with the message' + 
       ' received writen on it when ir doesn\'t recognize the error', function () {

        var imageId = 'id';
        var error = {message: "404 Error", body: "Volume not found"};

        callListVolume();
        callListVolumeErrorCallback(error);
        
        expect($('.alert > strong').last().text()).toBe(error.message + ' ');
        expect($('.alert > span').last().text()).toBe(error.body + ' ');

    });

    it('should display the error details when a click event is' + 
       ' triggered in the details button', function () {

        var imageId = 'id';
        var spyEvent = spyOnEvent('.alert a', 'click');
        var error = {message: "500 Error", body: "Internal Server Error"};

        callListVolume();
        callListVolumeErrorCallback(error);
        $('.alert a').trigger('click');
        
        expect($('.alert > div').last()).not.toHaveCss({display: "none"});

    });    

});
