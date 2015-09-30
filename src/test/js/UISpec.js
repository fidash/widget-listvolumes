/* global UI */

describe('User Interface', function () {
    "use strict";

    var respAuthenticate = null;
    var respVolumeList = null;
    var prefsValues;
    var drawCallbacks;

    beforeEach(function () {

        // Load prefs values
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

        MashupPlatform.setStrategy(new MyStrategy(), prefsValues);

        // Load fixtures
        jasmine.getFixtures().fixturesPath = 'base/src/test/fixtures/html';
        loadFixtures('defaultTemplate.html');
        jasmine.getJSONFixtures().fixturesPath = 'base/src/test/fixtures/json';
        respVolumeList = getJSONFixture('respVolumeList.json');
        respAuthenticate = getJSONFixture('respAuthenticate.json');
        respVolumeList = getJSONFixture('respVolumeList.json');

        // Callbacks spies
        drawCallbacks = jasmine.createSpyObj('drawCallbacks', ['refresh', 'create']);

        // Draw default columns
        UI.createTable(drawCallbacks.refresh, drawCallbacks.create);
        UI.updateHiddenColumns();
    });

    afterEach(function () {
        $('#volumes_table').empty();
        $('.FixedHeader_Cloned.fixedHeader.FixedHeader_Header > table').empty();
    });


    /**************************************************************************/
    /*                     I N T E R F A C E   T E S T S                      */
    /**************************************************************************/

    it('should have called MashupPlatform.wiring.pushEvent when click event triggered on a row', function () {

        var spyEvent = spyOnEvent('tbody > tr', 'click');
        var volumeId;

        UI.drawVolumes(drawCallbacks.refresh, false, respVolumeList.volumes);
        
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
        var expectedTextList = [volume.display_name, volume.status, volume.availability_zone, "15 GiB"];
        var cell;

        UI.drawVolumes(drawCallbacks.refresh, false, respVolumeList.volumes);        

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

        UI.drawVolumes(drawCallbacks.refresh, false, respVolumeList.volumes);        

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

        UI.updateHiddenColumns();
        UI.drawVolumes(drawCallbacks.refresh, false, respVolumeList.volumes);                

        for (var i=0; i<expectedColumns.length; i++) {

            column = $('.fixedHeader th');
            expect(column).toContainText(expectedColumns[i]);
        }
    });

    it('should start loading animation with width lesser than the height', function () {
        
        var bodyWidth = 100;

        $('body').width(bodyWidth);
        $('body').height(bodyWidth + 100);
        
        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        expect($('.loading i').css('font-size')).toBe(Math.floor(bodyWidth/4) + 'px');

        // Return to original state
        UI.stopLoadingAnimation($('.loading'));
    });

    it('should start loading animation with height lesser than the width', function () {
        
        var bodyHeight = 100;
        
        $('body').width(bodyHeight + 100);
        $('body').height(bodyHeight);

        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        expect($('.loading i').css('font-size')).toBe(Math.floor(bodyHeight/4) + 'px');

        // Return to original state
        UI.stopLoadingAnimation($('.loading'));
    });

    it('should expand the search input when a click event is triggered in the search button', function () {

        var spyEvent = spyOnEvent('.search-container button', 'click');

        UI.drawVolumes(drawCallbacks.refresh, false, respVolumeList.volumes);
        
        $('.search-container button').trigger('click');

        expect($('.search-container input')).toHaveClass('slideRight');
    });

    it('should correctly search volumes when new data is introduced in the input field', function () {

        var spyEvent;

        UI.drawVolumes(drawCallbacks.refresh, false, respVolumeList.volumes);
        
        spyEvent = spyOnEvent('.search-container input', 'keyup');
        $('.search-container input')
            .val('RealVirtualInteractionGE-3.3.3')
            .trigger('keyup');

        expect('keyup').toHaveBeenTriggeredOn('.search-container input');
        expect($('tbody').children().size()).toBe(1);
    });

    it('should expand the search bar', function () {
        var searchButton = $('.search-container button');
        var spyEvent = spyOnEvent('.search-container button', 'click');

        searchButton.click();

        expect('click').toHaveBeenTriggeredOn('.search-container button');
        expect('.search-container input').toHaveClass('slideRight');
        expect('.search-container input').toBeFocused();

        // Return to original state
        searchButton.click();
    });

    it('should collapse the search bar', function () {
        var searchButton = $('.search-container button');

        searchButton.click();
        searchButton.click();

        expect('.search-container input').not.toHaveClass('slideRight');
        expect('.search-container input').not.toBeFocused();
    });

    it('should expand the region selector', function () {
        var regionButton = $('button .fa-globe');
        var spyEvent = spyOnEvent('button .fa-globe', 'click');

        regionButton.click();

        expect('click').toHaveBeenTriggeredOn('button .fa-globe');
        expect('#region-selector').toHaveClass('slideRight');

        // Return to original state
        regionButton.click();
    });

    it('should collapse the region selector', function () {
        var regionButton = $('button .fa-globe');

        regionButton.click();
        regionButton.click();

        expect('#region-selector').not.toHaveClass('slideRight');
    });

    it('should select a region after clicking on its selector', function () {
        var regionSelector = $('input[value=Crete]').parent();

        regionSelector.click();

        expect('input[value=Crete]').toHaveClass('selected');
        expect('input[value=Crete]').toHaveProp('checked', true);

        // Return to original state
        regionSelector.click();
    });

    it('should deselect a region after clicking twice on its selector', function () {
        var regionSelector = $('input[value=Crete]').parent();

        regionSelector.click();
        regionSelector.click();

        expect('input[value=Crete]').not.toHaveClass('selected');
        expect('input[value=Crete]').toHaveProp('checked', false);
        
    });

    it('should select Spain2 by default when loading the widget', function () {
        expect('input[value=Spain2]').toHaveProp('checked', true);
    });
    
});