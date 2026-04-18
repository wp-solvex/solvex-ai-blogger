<?php

namespace SureCart\Licensing;

// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound

defined( 'ABSPATH' ) || exit;

/**
 * The settings class.
 */
class Settings {
	/**
	 * SureCart\Licensing\Client
	 *
	 * @var object
	 */
	protected $client;

	/**
	 * Holds the option key
	 *
	 * @var string
	 */
	private $option_key;

	/**
	 * Holds the option name
	 *
	 * @var string
	 */
	private $name;

	/**
	 * Holds the menu arguments
	 *
	 * @var array
	 */
	private $menu_args;

	/**
	 * Create the pages.
	 *
	 * @param SureCart\Licensing\Client $client The client.
	 */
	public function __construct( Client $client ) {
		$this->client     = $client;
		$this->name       = strtolower( preg_replace( '/\s+/', '', $this->client->name ) );
		$this->option_key = $this->name . '_license_options';
	}

	/**
	 * Set an option.
	 *
	 * @param string $name Name of option.
	 *
	 * @return mixed
	 */
	public function __get( $name ) {
		return $this->get_option( 'sc_' . $name );
	}

	/**
	 * Set an option
	 *
	 * @param string $name Name of option.
	 * @param mixed  $value Value.
	 *
	 * @return bool
	 */
	public function __set( $name, $value ) {
		return $this->set_option( 'sc_' . $name, $value );
	}

	/**
	 * Add the settings page.
	 *
	 * @param array $args Settings page args.
	 *
	 * @return void
	 */
	public function add_page( $args ): void {
		// store menu args for proper menu creation.
		$this->menu_args = wp_parse_args(
			$args,
			[
				'type'               => 'menu', // Can be: menu, options, submenu.
				'page_title'         => 'Manage License',
				'menu_title'         => 'Manage License',
				'capability'         => 'manage_options',
				'menu_slug'          => $this->client->slug . '-manage-license',
				'icon_url'           => '',
				'position'           => null,
				'activated_redirect' => null,
				'parent_slug'        => '',
			]
		);
		add_action( 'admin_menu', [ $this, 'admin_menu' ], 99 );
	}

	/**
	 * Set the option key.
	 *
	 * If someone wants to override the default generated key.
	 *
	 * @param string $key The option key.
	 */
	public function set_option_key( $key ) {
		$this->option_key = $key;
		return $this;
	}

	/**
	 * Add the admin menu
	 *
	 * @return void
	 */
	public function admin_menu(): void {
		switch ( $this->menu_args['type'] ) {
			case 'menu':
				$this->create_menu_page();
				break;
			case 'submenu':
				$this->create_submenu_page();
				break;
			case 'options':
				$this->create_options_page();
				break;
		}
	}

	/**
	 * Get all options
	 *
	 * @return array
	 */
	public function get_options() {
		return (array) get_option( $this->option_key, [] );
	}

	/**
	 * Clear out the options.
	 *
	 * @return bool
	 */
	public function clear_options() {
		return update_option( $this->option_key, [] );
	}

	/**
	 * Get a specific option
	 *
	 * @param string $name Option name.
	 *
	 * @return mixed
	 */
	public function get_option( $name ) {
		$options = $this->get_options();
		return $options[ $name ] ?? null;
	}

	/**
	 * Set the option.
	 *
	 * @param string $name The option name.
	 * @param mixed  $value The option value.
	 *
	 * @return bool
	 */
	public function set_option( $name, $value ) {
		$options          = (array) $this->get_options();
		$options[ $name ] = $value;
		return update_option( $this->option_key, $options );
	}

	/**
	 * The settings page menu output.
	 *
	 * @return void
	 */
	public function settings_output(): void {
		$this->license_form_submit();

		$this->print_css();

		$activation = $this->get_activation();
		$action     = ! empty( $activation->id ) ? 'deactivate' : 'activate'
		?>

		<div class="wrap">
			<h1></h1>
			<?php settings_errors(); ?>

			<div class="<?php echo esc_attr( $this->name ) . '-form-container'; ?>">
				<form method="post" action="<?php echo esc_attr( $this->form_action_url() ); ?>">
					<input type="hidden" name="_action" value="<?php echo esc_attr( $action ); ?>">
					<input type="hidden" name="_nonce" value="<?php echo esc_attr( wp_create_nonce( $this->client->name ) ); ?>">
					<input type="hidden" name="activation_id" value="<?php echo esc_attr( $this->activation_id ); ?>">

					<h2><?php echo esc_html( $this->menu_args['page_title'] ); ?></h2>
					<label for="license_key">
						<?php if ( $action === 'activate' ) { ?>
							<?php echo esc_html( sprintf( $this->client->__( 'Enter your license key to activate %s.', 'auto-ai-blogger' ), $this->client->name ) ); ?>
						<?php } else { ?>
							<?php echo esc_html( sprintf( $this->client->__( 'Your license is succesfully activated for this site.', 'auto-ai-blogger' ), $this->client->name ) ); ?>
						<?php } ?>
					</label>

					<?php if ( $action === 'activate' ) { ?>
						<input class="widefat" type="password" autocomplete="off" name="license_key" id="license_key" value="<?php echo esc_attr( $this->license_key ); ?>" autofocus>
					<?php } ?>

					<?php if ( isset( $_GET['debug'] ) ) { // phpcs:ignore?>
						<label for="license_id"><?php echo esc_html( sprintf( $this->client->__( 'License ID', 'auto-ai-blogger' ), $this->client->name ) ); ?></label>
						<input class="widefat" type="text" autocomplete="off" name="license_id" id="license_id" value="<?php echo esc_attr( $this->license_id ); ?>" autofocus>

						<label for="activation_id"><?php echo esc_html( sprintf( $this->client->__( 'Activation ID', 'auto-ai-blogger' ), $this->client->name ) ); ?></label>
						<input class="widefat" type="text" autocomplete="off" name="activation_id" id="activation_id" value="<?php echo esc_attr( $this->activation_id ); ?>" autofocus>
					<?php } ?>

					<?php submit_button( $action === 'activate' ? $this->client->__( 'Activate License' ) : $this->client->__( 'Deactivate License' ) ); ?>
				</form>
			</div>
		</div>
		<?php
	}

	/**
	 * Print the css for the form.
	 *
	 * @return void
	 */
	public function print_css(): void {
		wp_enqueue_style( 'autoaib-sc-licensing-style', AUTOAIB_BASE_URL . 'inc/licensing/assets/style.css', [], AUTOAIB_VERSION );
		wp_add_inline_style( 'autoaib-sc-licensing-style', $this->get_css() );
	}

	/**
	 * Get the css for the form.
	 *
	 * @return string
	 */
	public function get_css() {
		return '
			.' . sanitize_html_class( $this->name ) . '-form-container form {
				padding:30px;
				background: #fff;
				display: grid;
				gap: 1em;
				max-width: 600px;
			}
		';
	}

	/**
	 * Get the activation.
	 *
	 * @return Object|false
	 */
	public function get_activation() {
		$activation = false;
		if ( $this->activation_id ) {
			$activation = $this->client->activation()->get( $this->activation_id );
			if ( is_wp_error( $activation ) ) {
				$this->add_error( 'deactivaed', $this->client->__( 'Your license has been deactivated for this site.', 'auto-ai-blogger' ) );
				$this->clear_options();
			}
		}
		return $activation;
	}

	/**
	 * License form submit
	 */
	public function license_form_submit() {
		// only if we are submitting.
		if ( ! isset( $_POST['submit'] ) ) {
			return;
		}

		// Check nonce.
		if ( ! isset( $_POST['_nonce'], $_POST['_action'] ) ) {
			$this->add_error( 'missing_info', $this->client->__( 'Please add all information' ) );
			return;
		}

		// Cerify nonce.
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_nonce'] ) ), $this->client->name ) ) {
			$this->add_error( 'unauthorized', $this->client->__( "You don't have permission to manage licenses." ) );
			return;
		}

		// handle activation.
		if ( $_POST['_action'] === 'activate' ) {
			if ( ! isset( $_POST['license_key'] ) ) {
				$this->add_error( 'missing_license_key', $this->client->__( 'Please enter a license key.' ) );
				return;
			}
			$activated = $this->client->license()->activate( sanitize_text_field( wp_unslash( $_POST['license_key'] ) ) );
			if ( is_wp_error( $activated ) ) {
				$this->add_error( $activated->get_error_code(), $activated->get_error_message() );
				return;
			}

			return $this->add_success( 'activated', $this->client->__( 'This site was successfully activated.', 'auto-ai-blogger' ) );
		}

		// handle deactivation.
		if ( $_POST['_action'] === 'deactivate' ) {
			if ( ! isset( $_POST['activation_id'] ) ) {
				$this->add_error( 'missing_activation_id', $this->client->__( 'Activation ID is missing.' ) );
				return;
			}
			$deactivated = $this->client->license()->deactivate( sanitize_text_field( wp_unslash( $_POST['activation_id'] ) ) );
			if ( is_wp_error( $deactivated ) ) {
				$this->add_error( $deactivated->get_error_code(), $deactivated->get_error_message() );
			}

			return $this->add_success( 'deactivated', $this->client->__( 'This site was successfully deactivated.', 'auto-ai-blogger' ) );
		}
	}

	/**
	 * Add a notice.
	 *
	 * @param string $code Notice code.
	 * @param string $message Notice message.
	 * @param string $type Notice type.
	 *
	 * @return void
	 */
	public function add_notice( $code, $message, $type = 'info' ): void {
		add_settings_error(
			$this->name . '_license_options', // matches what we registered in `register_setting.
			$code, // the error code.
			$message,
			$type
		);
	}

	/**
	 * Add an error.
	 *
	 * @param string $code Error code.
	 * @param string $message Error message.
	 *
	 * @return void
	 */
	public function add_error( $code, $message ): void {
		$this->add_notice( $code, $message, 'error' );
	}

	/**
	 * Add an success message
	 *
	 * @param string $code Success code.
	 * @param string $message Success message.
	 *
	 * @return void
	 */
	public function add_success( $code, $message ): void {
		$this->add_notice( $code, $message, 'success' );
	}

	/**
	 * Form action URL
	 */
	private function form_action_url() {
		return apply_filters( 'autoaib_client_license_form_action', '' ); //phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
	}

	/**
	 * Add license menu page
	 */
	private function create_menu_page(): void {
		call_user_func(
			'add_menu_page',
			$this->menu_args['page_title'],
			$this->menu_args['menu_title'],
			$this->menu_args['capability'],
			$this->menu_args['menu_slug'],
			[ $this, 'settings_output' ],
			$this->menu_args['icon_url'],
			$this->menu_args['position']
		);
	}

	/**
	 * Add submenu page
	 */
	private function create_submenu_page(): void {
		call_user_func(
			'add_submenu_page',
			$this->menu_args['parent_slug'],
			$this->menu_args['page_title'],
			$this->menu_args['menu_title'],
			$this->menu_args['capability'],
			$this->menu_args['menu_slug'],
			[ $this, 'settings_output' ],
			$this->menu_args['position']
		);
	}

	/**
	 * Add submenu page
	 */
	private function create_options_page(): void {
		call_user_func(
			'add_options_page',
			$this->menu_args['page_title'],
			$this->menu_args['menu_title'],
			$this->menu_args['capability'],
			$this->menu_args['menu_slug'],
			[ $this, 'settings_output' ],
			$this->menu_args['position']
		);
	}
}
