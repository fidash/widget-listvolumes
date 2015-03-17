var OpenStackListVolume = (function (JSTACK) {
    "use strict";

    var url = 'https://cloud.lab.fiware.org/keystone/v2.0/';
    var dataTable, hiddenColumns, fixedHeader, selectedRowId;
    var focusState = false;

    function authenticate () {
        
        var tokenId, tenantId;
        var postBody, headersAuth;
        var options;
        var USERNAME, PASSWORD;
        var headersTenants = {};

        headersAuth = {
            "Accept": "application/json",
            "X-FI-WARE-OAuth-Token": "true",
            "X-FI-WARE-OAuth-Token-Body-Pattern": "%fiware_token%"
        };

        headersTenants['X-FI-WARE-OAuth-Token'] = 'true';
        headersTenants['X-FI-WARE-OAuth-Header-Name'] = 'X-Auth-Token';

        postBody = {
            "auth": {}
        };

        postBody.auth.token = {
            "id": "%fiware_token%"
        };


        // Initialize Keystone
        JSTACK.Keystone.init(url);

        // Get tenants with the user's FIWARE token
        MashupPlatform.http.makeRequest(url + 'tenants', {
            method: 'GET',
            requestHeaders: headersTenants,
            onSuccess: function (response) {

                response = JSON.parse(response.responseText);
                postBody.auth.tenantId = response.tenants[0].id;

                // Post request to receive service token from Openstack
                MashupPlatform.http.makeRequest(url + 'tokens', {
                    requestHeaders: headersAuth,
                    contentType: "application/json",
                    postBody: JSON.stringify(postBody),
                    onSuccess: function (response) {
                        response = JSON.parse(response.responseText);

                        // Mimic JSTACK.Keystone.authenticate behavior on success
                        JSTACK.Keystone.params.token = response.access.token.id;
                        JSTACK.Keystone.params.access = response.access;
                        JSTACK.Keystone.params.currentstate = 2;

                        createTable();
                        getVolumeList();
                    },
                    onFailure: function (response) {
                        onError(response);
                    }
                });

            },
            onFailure: function (response) {
                onError(response);
            }
        });
        
    }

    function createTable () {

        var refresh, createButton, modalCreateButton, search, searchButton,
            searchInput;

        var columns = [
            {'title': 'ID'},
            {'title': 'Name'},
            {'title': 'Status'},
            {'title': 'Availability Zone'},
            {'title': 'Created'},
            {'title': 'Volume Type'},
            {'title': 'Size'},
            {'title': 'Snapshot'}
        ];

        dataTable = $('#volumes_table').DataTable({
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

        // Padding bottom for fixed to bottom bar
        $('#volumes_table_wrapper').attr('style', 'padding-bottom: 49px;');

        // Pagination style
        $('#volumes_table_paginate').addClass('pagination pull-right');

        // Fixed header
        fixedHeader = new $.fn.dataTable.FixedHeader(dataTable);

        $(window).resize(function () {
            fixedHeader._fnUpdateClones(true); // force redraw
            fixedHeader._fnUpdatePositions();
        });


        // Set Search field
        search = $('<div>')
            .addClass('input-group search-container')
            .insertBefore($('#volumes_table_paginate'));

        searchButton = $('<button>')
            .addClass('btn btn-default')
            .html('<i class="fa fa-search"></i>');

        $('<span>')
            .addClass('input-group-btn')
            .append(searchButton)
            .appendTo(search)
            .css('z-index', 20);

        searchInput = $('<input>')
            .attr('type', 'text')
            .attr('placeholder', 'Search for...')
            .addClass('search form-control')
            .appendTo(search);

        // Search click animation
        searchButton.on('click', function (e) {
            focusState = !focusState;
            
            searchInput.toggleClass('slideRight');

            if (focusState) {
                searchInput.focus();
            }

        });

        // Search input
        searchInput.on( 'keyup', function () {
            dataTable.search(this.value).draw();
        });


        // Set refresh button
        refresh = $('<button>')
            .html('<i class="fa fa-refresh"></i>')
            .addClass('btn btn-default action-button pull-left')
            .click(getVolumeList)
            .insertBefore($('#volumes_table_paginate'));

    }

    function getVolumeList () {

        JSTACK.Nova.Volume.getvolumelist(true, callbackVolumeList, onError);

    }

    function rowClickCallback (id) {
        var data = {
            'id': id,
            'access': JSTACK.Keystone.params.access
        };
        MashupPlatform.wiring.pushEvent('volume_id', JSON.stringify(data));
    }

    function handlePreferences () {

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
                dataTable.column(i).visible(display, false);
            }

        }

        // Recalculate all columns size at once
        if (dataTable) {
            dataTable.columns.adjust().draw(false);
        }

    }

    function callbackVolumeList (result) {
        
        var volume,
            scroll,
            page,
            row,
            displayableSize;

        var dataSet = [];

         // Save previous scroll and page
        scroll = $(window).scrollTop();
        page = dataTable.page();

        // Clear previous elements
        dataTable.clear();

        // Build table body
        for (var i=0; i<result.volumes.length; i++) {
            volume = result.volumes[i];

            displayableSize = volume.size + ' GB';

            row = dataTable.row.add([
                volume.id,
                volume.display_name,
                volume.status,
                volume.availability_zone,
                volume.created_at,
                volume.volume_type,
                displayableSize,
                volume.snapshot_id
            ])
            .draw()
            .nodes()
            .to$();

            if (volume.id === selectedRowId) {
                row.addClass('selected');
            }
        }

        // Remove previous row click events
        $('#volumes_table tbody').off('click', '**');

        // Row events
        $('#volumes_table tbody').on('click', 'tr', function () {
            var data = dataTable.row(this).data();
            var id = data[0];
            selectedRowId = id;
            
            dataTable.row('.selected')
                .nodes()
                .to$()
                .removeClass('selected');
            $(this).addClass('selected');
            rowClickCallback(id);
        });

        dataTable.columns.adjust().draw();

        // Restore previous scroll and page
        $(window).scrollTop(scroll);
        dataTable.page(page).draw(false);

        setTimeout(function () {
            getVolumeList();
        }, 4000);


        fixedHeader._fnUpdateClones(true); // force redraw
        fixedHeader._fnUpdatePositions();

    }

    function onError (error) {
        console.log('Error: ' + JSON.stringify(error));
    }

    function OpenStackListVolume () {

        // Initialize parameters
        dataTable = null;
        hiddenColumns = [];

        this.init = authenticate;
        this.listVolume = getVolumeList;

        // Initialize preferences
        handlePreferences();

        // Preferences handler
        MashupPlatform.prefs.registerCallback(handlePreferences);

    }

    return OpenStackListVolume;
})(JSTACK);
