/* global OpenStackListVolume, spyOnEvent, MyStrategy, getJSONFixture */

describe('Test Volume Table', function () {
	"use strict";

	var openStack = null;
	var respAuthenticate = null;
	var respTenants = null;
	var respServices = null;
	var respVolumeList = null;
	var prefsValues;

	beforeEach(function() {

		JSTACK.Keystone = jasmine.createSpyObj("Keystone", ["init", "authenticate", "gettenants", "params"]);
		JSTACK.Nova.Volume = jasmine.createSpyObj("Volume", ["getvolumelist"]);

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
		setFixtures('<table id="volumes_table"></table>');
		jasmine.getJSONFixtures().fixturesPath = 'src/test/fixtures/json';
		respVolumeList = getJSONFixture('respVolumeList.json');
		respAuthenticate = getJSONFixture('respAuthenticate.json');
		respTenants = getJSONFixture('respTenants.json');
		respServices = getJSONFixture('respServices.json');
		respVolumeList = getJSONFixture('respVolumeList.json');

		// Create new volume
		openStack = new OpenStackListVolume();
	});

	afterEach(function () {
		$('#volumes_table').empty();
		$('.FixedHeader_Cloned.fixedHeader.FixedHeader_Header > table').empty();
	});


	/**************************************************************************/
	/*****************************AUXILIAR FUNCTIONS***************************/
	/**************************************************************************/

	function callListVolume() {

		var handleServiceTokenCallback, getTenantsOnSuccess;
		openStack.init();

		getTenantsOnSuccess = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onSuccess;
		respTenants = {
			responseText: JSON.stringify(respTenants)
		};
		getTenantsOnSuccess(respTenants);
		
		handleServiceTokenCallback = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onSuccess;
		respServices = {
			responseText: JSON.stringify(respServices)
		};
		handleServiceTokenCallback(respServices);

	}

	function callgetTenantsWithError () {
		
		var getTenantsOnError;

		openStack.init();
		getTenantsOnError = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onFailure;
		getTenantsOnError('Test successful');
	}

	function callAuthenticateWithError () {
		
		var authenticateError, getTenantsOnSuccess;

		getTenantsOnSuccess = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onSuccess;
		respTenants = {
			responseText: JSON.stringify(respTenants)
		};
		getTenantsOnSuccess(respTenants);

		authenticateError = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onFailure;
		authenticateError('Test successful');
	}

	function callListVolumeSuccessCallback (volumeList) {

		var callback = JSTACK.Nova.Volume.getvolumelist.calls.mostRecent().args[1];
		
		callback(volumeList);

	}


	/**************************************************************************/
	/****************************FUNCTIONALITY TESTS***************************/
	/**************************************************************************/

	it('should authenticate through wirecloud proxy', function() {

		callListVolume();

		expect(MashupPlatform.http.makeRequest.calls.count()).toBe(2);
		expect(JSTACK.Keystone.params.currentstate).toBe(2);

	});

	it('should have created a table with the received volumes', function () {

		callListVolume();
		callListVolumeSuccessCallback(respVolumeList);

		var rows = document.querySelectorAll('tbody > tr');

		expect(rows.length).toBeGreaterThan(0);
	});

	it('should call error callback for getTenants correctly',function () {

		var consoleSpy = spyOn(console, "log");

		callgetTenantsWithError();
		expect(consoleSpy.calls.mostRecent().args[0]).toBe('Error: "Test successful"');
	});

	it('should call error callback for authenticate correctly', function () {
		
		var consoleSpy = spyOn(console, "log");

		callgetTenantsWithError();
		callAuthenticateWithError();
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

});
