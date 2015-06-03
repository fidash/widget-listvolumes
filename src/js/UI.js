/* global Region,Utils */

var UI = (function () {
	"use strict";

    var hiddenColumns = [];
    var dataTable;

    /******************************************************************/
    /*                P R I V A T E   F U N C T I O N S               */
    /******************************************************************/

    function selectVolume (id) {
        var data = {
            'id': id,
            'access': JSTACK.Keystone.params.access,
            'token': JSTACK.Keystone.params.token
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
            //{'title': 'Region'}
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

        });

        searchInput.on( 'keyup', function () {
            dataTable.api().search(this.value).draw();
        });
    }

    function createModalButton (nextElement) {
        $('<button>')
            .html('<i class="fa fa-plus"></i>')
            .addClass('btn btn-primary action-button pull-left')
            .attr('data-toggle', 'modal')
            .attr('data-target', '#createVolumeModal')
            .insertBefore(nextElement);
    }

    function createRefreshButton (nextElement, refreshCallback) {
        $('<button>')
            .html('<i class="fa fa-refresh"></i>')
            .addClass('btn btn-default action-button pull-left')
            .click(refreshCallback)
            .insertBefore(nextElement);
    }

    function initFixedHeader () {
        // Fixed header
        UI.fixedHeader = new $.fn.dataTable.FixedHeader(dataTable);

        $(window).resize(function () {
            UI.fixedHeader._fnUpdateClones(true); // force redraw
            UI.fixedHeader._fnUpdatePositions();
        });
    }

    function buildTableBody (volumeList) {

        var displayableSize, row;

        // Clear previous elements
        dataTable.api().clear();

        volumeList.volumes.forEach(function (volume) {

            displayableSize = volume.size + ' GB';

            row = dataTable.api().row.add([
                volume.id,
                volume.display_name,
                volume.status,
                volume.availability_zone,
                volume.created_at,
                volume.volume_type,
                displayableSize,
                volume.snapshot_id,
                //volume.region
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
            UI.selectedRowId = id;
            
            dataTable.api().row('.selected')
                .nodes()
                .to$()
                .removeClass('selected');
            $(this).addClass('selected');
            selectVolume(id);
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

        createSearchField($('#volumes_table_paginate'));
        createModalButton($('#volumes_table_paginate'));
        createRefreshButton($('#volumes_table_paginate'), refreshCallback);

        // Set create volume button event
        $('#create-volume').on('click', createCallback);

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

    function drawVolumes (refreshCallback, volumeList) {
        
        // Save previous scroll and page
        var scroll = $(window).scrollTop();
        var page = dataTable.api().page();

        buildTableBody(volumeList);
        setSelectVolumeEvents();

        dataTable.api().columns.adjust().draw();

        // Restore previous scroll and page
        $(window).scrollTop(scroll);
        dataTable.api().page(page).draw(false);

        setTimeout(function () {
            refreshCallback();
        }, 4000);

        initFixedHeader();

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

        // Hide
        $('.loading').addClass('hide');
    }

    return {
        createTable: createTable,
        updateHiddenColumns: updateHiddenColumns,
        drawVolumes: drawVolumes,
        startLoadingAnimation: startLoadingAnimation,
        stopLoadingAnimation: stopLoadingAnimation
    };
})();