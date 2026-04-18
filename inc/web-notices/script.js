/**
 * Web Admin Notices Trigger.
 *
 * @author WPSolvex
 */

( function( $ ) {
	/**
	 * Helper class for the main admin interface.
	 *
	 * @since 1.0.0
	 * @class WebNotices
	 */
	WebNotices = {

		/**
		 * Initializes our custom logic for the Customizer.
		 *
		 * @since 1.0.0
		 * @function init
		 */
		init() {
			this._bind();
		},

		/**
		 * Binds events.
		 *
		 * @since 1.0.0
		 * @access private
		 * @function _bind
		 */
		_bind() {
			$( document ).on( 'click', '.web-notice-close', WebNotices._dismissNoticeNew );
			$( document ).on( 'click', '.web-notice .notice-dismiss', WebNotices._dismissNotice );
		},

		_dismissNotice( event ) {
			event.preventDefault();

			const repeat_notice_after = $( this ).parents( '.web-notice' ).data( 'repeat-notice-after' ) || '';
			const notice_id = $( this ).parents( '.web-notice' ).attr( 'id' ) || '';

			WebNotices._ajax( notice_id, repeat_notice_after );
		},

		_dismissNoticeNew( event ) {
			event.preventDefault();

			const repeat_notice_after = $( this ).attr( 'data-repeat-notice-after' ) || '';
			const notice_id = $( this ).parents( '.web-notice' ).attr( 'id' ) || '';

			const $el = $( this ).parents( '.web-notice' );
			$el.fadeTo( 100, 0, function() {
				$el.slideUp( 100, function() {
					$el.remove();
				} );
			} );

			WebNotices._ajax( notice_id, repeat_notice_after );

			const link = $( this ).attr( 'href' ) || '';
			const target = $( this ).attr( 'target' ) || '';
			if ( '' !== link && '_blank' === target ) {
				window.open( link, '_blank' );
			}
		},

		_ajax( notice_id, repeat_notice_after ) {
			if ( '' === notice_id ) {
				return;
			}

			$.ajax( {
				url: ajaxurl,
				type: 'POST',
				data: {
					action: 'solvex-aib-notice-dismiss',
					nonce: solvex_aib_web_notices._notice_nonce,
					notice_id,
					repeat_notice_after: parseInt( repeat_notice_after ),
				},
			} );
		},
	};

	$( function() {
		WebNotices.init();
	} );
}( jQuery ) );
