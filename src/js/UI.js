/* global Region,Utils */

var UI = (function () {
    "use strict";

    var hiddenColumns = [];
    var dataTable;

    /******************************************************************/
    /*                P R I V A T E   F U N C T I O N S               */
    /******************************************************************/

    function selectVolume (id, region) {
        var data = {
            'id': id,
            'access': JSTACK.Keystone.params.access,
            'token': JSTACK.Keystone.params.token,
            'region': region
        };
        MashupPlatform.wiring.pushEvent('volume_id', JSON.stringify(data));
    }

    function initDataTable () {
        var columns = [
            {'title': 'ID'},
            {'title': 'Name'},
            {'title': 'Status'},
            {'title': 'Availability Zone'},
            {'title': 'Created'},
            {'title': 'Volume Type'},
            {'title': 'Size'},
            {'title': 'Snapshot'},
            {'title': 'Region'}
        ];

        dataTable = $('#volumes_table').dataTable({
            'columns': columns,
            "columnDefs": [
                {
                    "targets": hiddenColumns,
                    "visible": false
                }
            ],
            'binfo': false,
            'dom': 't<"navbar navbar-default navbar-fixed-bottom"p>',
            'pagingType': 'full_numbers',
            'info': false,
            "language": {
                "paginate": {
                    "first": '<i class="fa fa-fast-backward"></i>',
                    "last": '<i class="fa fa-fast-forward"></i>',
                    "next": '<i class="fa fa-forward"></i>',
                    "previous": '<i class="fa fa-backward"></i>'
                }
            }
        });
    }

    function createSearchField (nextElement) {

        var search = $('<div>').addClass('input-group search-container').insertBefore(nextElement);
        var searchButton = $('<button>').addClass('btn btn-default').html('<i class="fa fa-search"></i>');
        $('<span>').addClass('input-group-btn').append(searchButton).appendTo(search).css('z-index', 20);
        var searchInput = $('<input>').attr('type', 'text').attr('placeholder', 'Search for...').addClass('search form-control').appendTo(search);
        var focusState = false;

        searchButton.on('click', function (e) {
            focusState = !focusState;

            searchInput.toggleClass('slideRight');

            if (focusState) {
                searchInput.focus();
            }
            else {
                searchInput.blur();
            }

        });

        searchInput.on( 'keyup', function () {
            dataTable.api().search(this.value).draw();
        });
    }

    function createModalButton (nextElement) {
        $('<button>')
            .html('<i class="fa fa-plus"></i>')
            .addClass('btn btn-success action-button pull-left')
            .attr('data-toggle', 'modal')
            .attr('data-target', '#createVolumeModal')
            .insertBefore(nextElement);
    }

    function createRefreshButton (nextElement, refreshCallback) {
        $('<button>')
            .html('<i class="fa fa-refresh"></i>')
            .addClass('btn btn-default action-button pull-left')
            .click(refreshCallback.bind(null, false))
            .insertBefore(nextElement);
    }

    function createProgressBar (nextElement) {
        var pgb = $('<div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div>');
        $("<div id=\"loadprogressbar\"></div>")
            .addClass('progress')
            .addClass('hidden') // Start hidden
            .append(pgb)
            .insertBefore(nextElement);
    }

    function activateProgressBar () {
        $("#loadprogressbar")
            .removeClass("hidden");
    }

    function deactivateProgressBar () {
        $("#loadprogressbar")
            .removeClass("hidden") // remove first
            .addClass("hidden");
    }

    function createRegionsButton (nextElement) {
        $('<button>')
            .html('<i class="fa fa-globe"></i>')
            .addClass('btn btn-primary action-button pull-left')
            .click(toggleRegionSelector)
            .insertBefore(nextElement);
    }

    function createRegionSelector () {
        var regions = Region.getAvailableRegions();
        var regionSelector = $('<div>')
                .attr('id', 'region-selector')
                .addClass('region-selector')
                .css('max-height', window.innerHeight - 50)
                .appendTo($('body'));


        $(window).resize(function () {
            regionSelector.css('max-height', window.innerHeight - 50);
        });

        regions.forEach(function(region) {
            $('<div>')
                .html('<input type="checkbox" name="region" value="' + region + '" /> ' + region)
                .addClass('region-container')
                .click(function (e) {
                    var input = $('input', this);
                    input.toggleClass('selected');
                    if (input.prop('checked')) {
                        input.prop('checked', false);
                        Region.setCurrentRegions(regionSelector);
                    }
                    else {
                        input.prop('checked', true);
                        Region.setCurrentRegions(regionSelector);
                    }
                })
                .appendTo(regionSelector);
        });

        // Select default region
        $("div>input[type=checkbox][value=Spain2]").prop("checked", true);
        Region.setCurrentRegions(regionSelector);
    }

    function toggleRegionSelector () {
        $('#region-selector').toggleClass('slideRight');
    }

    function createFormRegionSelector () {

        var availableRegions = Region.getAvailableRegions();
        var currentRegions = Region.getCurrentRegions();
        var regionFormSelector = $('#id_region');

        availableRegions.forEach(function (region) {
            $('<option>')
                .val(region)
                .text(region)
                .appendTo(regionFormSelector);
        });

        if (currentRegions.length === 1) {
            $('option[value=' + currentRegions[0] + ']').attr('default', true);
        }

    }

    function initFixedHeader () {
        UI.fixedHeader = new $.fn.dataTable.FixedHeader(dataTable);
        $(window).resize(redrawFixedHeaders);
    }

    function redrawFixedHeaders () {
        UI.fixedHeader._fnUpdateClones(true); // force redraw
        UI.fixedHeader._fnUpdatePositions();
    }

    function buildTableBody (volumeList) {

        var displayableSize, row;

        // Clear previous elements
        dataTable.api().clear();

        volumeList.forEach(function (volume) {

            displayableSize = volume.size + " GiB";

            row = dataTable.api().row.add([
                volume.id,
                volume.display_name,
                volume.status,
                volume.availability_zone,
                volume.created_at,
                volume.volume_type,
                displayableSize,
                volume.snapshot_id,
                volume.region
            ])
                .draw()
                .nodes()
                .to$();

            if (UI.selectedRowId && volume.id === UI.selectedRowId) {
                row.addClass('selected');
            }
        });
    }

    function setSelectVolumeEvents () {
        // Remove previous row click events
        $('#volumes_table tbody').off('click', '**');

        // Row events
        $('#volumes_table tbody').on('click', 'tr', function () {
            var data = dataTable.api().row(this).data();
            var id = data[0];
            var region = data[data.length - 1];

            UI.selectedRowId = id;

            dataTable.api().row('.selected')
                .nodes()
                .to$()
                .removeClass('selected');
            $(this).addClass('selected');
            selectVolume(id, region);
        });
    }

    function joinArrays(a, b) {
        return a.filter(function(i) {
            return b.indexOf(i) >= 0;
        });
    }

    /******************************************************************/
    /*                 P U B L I C   F U N C T I O N S                */
    /******************************************************************/

    function createTable (refreshCallback, createCallback) {

        initDataTable();

        // Padding bottom for fixed to bottom bar
        $('#volumes_table_wrapper').attr('style', 'padding-bottom: 40px;');

        // Pagination style
        $('#volumes_table_paginate').addClass('pagination pull-right');

        createFormRegionSelector();
        createRegionSelector();
        createRegionsButton($('#volumes_table_paginate'));
        createSearchField($('#volumes_table_paginate'));
        createModalButton($('#volumes_table_paginate'));
        createRefreshButton($('#volumes_table_paginate'), refreshCallback);
        createProgressBar($('#volumes_table_paginate'));

        // Set create volume button event
        $('#create-volume').on('click', createCallback);

        initFixedHeader();
    }

    function updateHiddenColumns () {

        var display;
        var preferenceList = [
            "id",
            "name",
            "status",
            "availability_zone",
            "created_at",
            "volume_type",
            "size",
            "snapshot_id"
        ];

        hiddenColumns = [];

        for (var i=0; i<preferenceList.length; i++) {

            display = MashupPlatform.prefs.get(preferenceList[i]);

            if (!display) {
                hiddenColumns.push(i);
            }

            if (dataTable) {
                dataTable.api().column(i).visible(display, false);
            }

        }

        // Recalculate all columns size at once
        if (dataTable) {
            dataTable.api().columns.adjust();
        }

    }

    function drawVolumes (refreshCallback, autoRefresh, volumeList) {

        // Save previous scroll and page
        var scroll = $(window).scrollTop();
        var page = dataTable.api().page();

        buildTableBody(volumeList);
        setSelectVolumeEvents();

        // Restore previous scroll and page
        $(window).scrollTop(scroll);
        dataTable.api().page(page).draw(false);

        // Adjust headers and columns
        dataTable.api().columns.adjust();
        redrawFixedHeaders();

        if (autoRefresh) {
            setTimeout(function () {
                refreshCallback(true);
            }, 4000);
        }

    }

    function startLoadingAnimation () {

        var bodyWidth = $('body').width();
        var bodyHeight = $('body').height();

        // Reference size is the smaller between height and width
        var referenceSize = (bodyWidth < bodyHeight) ? bodyWidth : bodyHeight;
        var font_size = referenceSize / 4;

        // Calculate loading icon size
        $('.loading i').css('font-size', font_size);

        // Show
        $('.loading').removeClass('hide');

    }

    function stopLoadingAnimation () {
        $('.loading').addClass('hide');
    }

    function clearTable () {
        dataTable.api().clear();
        dataTable.api().draw();
    }

    function toggleManyRegions (regions) {
        var otherregions = Region.getAvailableRegions();
        var joinregions = joinArrays(regions, otherregions);
        var i, region, input;

        // First set everything to false
        for(i=0;  i<otherregions.length; i++) {
            region = otherregions[i];
            input = $("input[value=" + region + "]");
            input.removeClass('selected');
            input.prop("checked", false);
        }

        // Then check only the received
        for (i=0; i<joinregions.length; i++) {
            region = joinregions[i];
            input = $("input[value=" + region + "]");
            input.toggleClass('selected');
            input.prop("checked", !input.prop("checked"));
        }
        Region.setCurrentRegions($("#region-selector"));
    }

    return {
        clearTable: clearTable,
        createTable: createTable,
        updateHiddenColumns: updateHiddenColumns,
        drawVolumes: drawVolumes,
        startLoadingAnimation: startLoadingAnimation,
        stopLoadingAnimation: stopLoadingAnimation,
        toggleManyRegions: toggleManyRegions,
        activateProgressBar: activateProgressBar,
        deactivateProgressBar: deactivateProgressBar
    };
})();
