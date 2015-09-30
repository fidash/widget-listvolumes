/* global Region */

describe('Test Region Module', function () {
    "use strict";

    var catalog = null;
    var regionSelector = null;

    function selectRegionsInHTML (regions) {
        regions.forEach(function (region) {
            $('input[value=' + region + ']').prop('checked', true);
        });
    }

    beforeEach(function () {
        // Deselect all regions
        $('input').prop('checked', false);

        jasmine.getFixtures().fixturesPath = 'base/src/test/fixtures/html';
        loadFixtures('regionSelector.html');

        jasmine.getJSONFixtures().fixturesPath = 'base/src/test/fixtures/json';
        catalog = getJSONFixture('catalog.json');

        regionSelector = $('#region-selector');

        JSTACK.Keystone = jasmine.createSpyObj("Keystone", ["params"]);
        JSTACK.Keystone.params.access = {
            "serviceCatalog": catalog
        };
    });


    it('should return the current regions after having set them', function () {
        var expectedRegions = ['Crete', 'Prague'];

        selectRegionsInHTML(expectedRegions);
        Region.setCurrentRegions(regionSelector);

        expect(Region.getCurrentRegions()).toEqual(expectedRegions);
    });

    it('should return all available regions according to the given service catalog', function () {
        var availableRegions = ['Crete', 'Volos', 'Gent', 'Prague'];

        expect(Region.getAvailableRegions()).toEqual(availableRegions);
    });

    it('should leave the current region list empty after setting the regions with no one selected', function () {
        Region.setCurrentRegions(regionSelector);

        expect(Region.getCurrentRegions()).toEqual([]);
    });

});