/* global OpenStackListVolume, spyOnEvent, MyStrategy, getJSONFixture */

describe('Test Volume Table', function () {
	"use strict";

	var listVolumes = null;
	var respAuthenticate = null;
	var respVolumeList = null;
	var prefsValues;

	beforeEach(function() {

		JSTACK.Keystone = jasmine.createSpyObj("Keystone", ["init", "authenticate", "gettenants", "params"]);
		JSTACK.Nova.Volume = jasmine.createSpyObj("Volume", ["getvolumelist", "createvolume"]);

		// Reset prefs values
		prefsValues = {
	    	"MashupPlatform.prefs.get": {
		        "id": false,
		        "name": true,
		        "status": true,
		        "availability_zone": true,
		        "created_at": false,
		        "volume_type": false,
		        "size": true,
		        "snapshot_id": false
		    }
		};

		// Set/Reset strategy
		MashupPlatform.setStrategy(new MyStrategy(), prefsValues);

		// Set/Reset fixtures
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

	afterEach(function () {
		$('#volumes_table').empty();
		$('.FixedHeader_Cloned.fixedHeader.FixedHeader_Header > table').empty();
	});


	/**************************************************************************/
	/*****************************AUXILIAR FUNCTIONS***************************/
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

		var callback = JSTACK.Nova.Volume.getvolumelist.calls.mostRecent().args[1];
		
		callback(volumeList);

	}

	function callListVolumeErrorCallback (error) {

		var callback = JSTACK.Nova.Volume.getvolumelist.calls.mostRecent().args[2];

		callback(error);
	}


	/**************************************************************************/
	/****************************FUNCTIONALITY TESTS***************************/
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
		expectedCount = JSTACK.Nova.Volume.getvolumelist.calls.count() + 1;
		callListVolumeSuccessCallback(respVolumeList);
		callback = setTimeout.calls.mostRecent().args[0];
		callback();

		expect(JSTACK.Nova.Volume.getvolumelist.calls.count()).toEqual(expectedCount);
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
		expect(JSTACK.Nova.Volume.createvolume).toHaveBeenCalledWith(jasmine.any(String), "VolumeName", jasmine.any(String), jasmine.any(Function), jasmine.any(Function));

	});

	it('should call the create volume callback correctly', function () {
		var createButton = $("#create-volume");
		var logSpy = spyOn(console, "log");
		var createVolumeSuccessCallback;

		callListVolume();
		callListVolumeSuccessCallback(respVolumeList);
		createButton.trigger('click');
		createVolumeSuccessCallback = JSTACK.Nova.Volume.createvolume.calls.mostRecent().args[3];
		createVolumeSuccessCallback();

		expect(logSpy).toHaveBeenCalledWith("Volume successfully created");
	});


	/**************************************************************************/
	/*****************************INTERFACE TESTS******************************/
	/**************************************************************************/

	it('should have called MashupPlatform.wiring.pushEvent when click event triggered on a row', function () {

		var spyEvent = spyOnEvent('tbody > tr', 'click');
		var volumeId;

		callListVolume();
		callListVolumeSuccessCallback(respVolumeList);
		$('tbody > tr').trigger('click');

		for (var i=0; i<respVolumeList.volumes.length; i++) {

			if (respVolumeList.volumes[i].id === JSON.parse(MashupPlatform.wiring.pushEvent.calls.mostRecent().args[1]).id) {
				volumeId = respVolumeList.volumes[i].id;
			}
		}

		expect(MashupPlatform.wiring.pushEvent).toHaveBeenCalled();
		expect(volumeId).toBeDefined();
	});

	it('should add the given row', function() {

		var volume = respVolumeList.volumes[0];
		var expectedTextList = [volume.display_name, volume.status, volume.availability_zone, "15 GB"];
		var cell;

		callListVolume();
		callListVolumeSuccessCallback(respVolumeList);

	    for (var i=0; i<expectedTextList.length; i++) {
	    	
	    	cell = $('tbody > tr > td')[i];
	    	expect(cell).toContainText(expectedTextList[i]);
	    }
	});

	it('should make the columns given in the preferences visible', function () {

		var column;
		var expectedColumns = [
			'Name',
			'Status',
			'Availability Zone',
			'Size'
		];

		callListVolume();
		callListVolumeSuccessCallback(respVolumeList);

		for (var i=0; i<expectedColumns.length; i++) {

			column = $('.fixedHeader th');
			expect(column).toContainText(expectedColumns[i]);
		}

	});

	it('should dynamically change the displayed columns when preferences change', function () {

		var column, handlePreferences;
		var expectedColumns = [
			'Created',
			'Volume Type',
			'Snapshot'
		];

		// Change preferences
		prefsValues["MashupPlatform.prefs.get"].name = false;
		prefsValues["MashupPlatform.prefs.get"].status = false;
		prefsValues["MashupPlatform.prefs.get"].availability_zone = false;
		prefsValues["MashupPlatform.prefs.get"].size = false;
		prefsValues["MashupPlatform.prefs.get"].created_at = true;
		prefsValues["MashupPlatform.prefs.get"].volume_type = true;
		prefsValues["MashupPlatform.prefs.get"].snapshot_id = true;

		callListVolume();
		callListVolumeSuccessCallback(respVolumeList);
		handlePreferences = MashupPlatform.prefs.registerCallback.calls.mostRecent().args[0];
		handlePreferences();

		for (var i=0; i<expectedColumns.length; i++) {

			column = $('.fixedHeader th');
			expect(column).toContainText(expectedColumns[i]);
		}
	});

	it('should start loading animation with width lesser than the height', function () {
		
		var bodyWidth = 100;

        $('body').width(bodyWidth);
        $('body').height(bodyWidth + 100);
        callListVolume();
        callListVolumeSuccessCallback(respVolumeList);

        expect($('.loading i').css('font-size')).toBe(Math.floor(bodyWidth/4) + 'px');
	});

	it('should start loading animation with height lesser than the width', function () {
		
		var bodyHeight = 100;
        
        $('body').width(bodyHeight + 100);
        $('body').height(bodyHeight);

        callListVolume();
        callListVolumeSuccessCallback(respVolumeList);

        expect($('.loading i').css('font-size')).toBe(Math.floor(bodyHeight/4) + 'px');
	});

	it('should show an error alert with the appropiate predefined' + 
       ' message and the received message body in the details', function () {

		var imageId = 'id';
		var error = {message: "500 Error", body: "Internal Server Error"};
		
		callListVolume();
		callListVolumeErrorCallback(error);
		
		expect($('.alert > strong').last().text()).toBe('Error ');
		expect($('.alert > span').last().text()).toBe('An error has occurred on the server side. ');
		expect($('.alert > div').last().text()).toBe(error.message + ' ' + error.body + ' ');

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

	it('should expand the search input when a click event is triggered in the search button', function () {

		var spyEvent = spyOnEvent('.search-container button', 'click');

		callListVolume();
		callListVolumeSuccessCallback(respVolumeList);
		$('.search-container button').trigger('click');

		expect($('.search-container input')).toHaveClass('slideRight');
	});

	it('should correctly search volumes when new data is introduced in the input field', function () {

		var spyEvent;

		callListVolume();
		callListVolumeSuccessCallback(respVolumeList);
		spyEvent = spyOnEvent('.search-container input', 'keyup');
		$('.search-container input')
			.val('RealVirtualInteractionGE-3.3.3')
			.trigger('keyup');

		expect('keyup').toHaveBeenTriggeredOn('.search-container input');
		expect($('tbody').children().size()).toBe(1);
	});

});
