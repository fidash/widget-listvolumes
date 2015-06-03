var Utils = (function () {
	"use strict";

	function createAlert (type, title, message, details) {

        // TODO buffer them and shown them on a list instead of removing them
        // Hide previous alerts
        $('.alert').hide();
 
        var alert = $('<div>')
            .addClass('alert alert-dismissible alert-' + type + ' fade in')
            .attr('role', 'alert')
            .html('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>');

        // Title
        $('<strong>')
            .text(title + ' ')
            .appendTo(alert);

        // Message
        $('<span>')
            .text(message  + ' ')
            .appendTo(alert);

        if (details) {
            // Details
            var detailsMessage = $('<div>')
                .appendTo(alert)
                .hide();
            for (var detail in details) {
                detailsMessage.text(detailsMessage.text() + details[detail] + ' ');
            }

            // Toggle details
            $('<a>')
                .text('Details')
                .click(function () {
                    detailsMessage.toggle('fast');
                })
                .insertBefore(detailsMessage);
        }

        $('body').append(alert);

    }

	return {
		createAlert: createAlert
	};
})();