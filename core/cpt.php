<?php
/**
 * Campaigns CPT
 *
 * This class will holds the Campaigns related to the admin area modification
 * along with the plugin functionalities.
 *
 * @package auto-ai-blogger
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Core;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;

defined( 'ABSPATH' ) || exit;

/**
 * Campaigns CPT
 *
 * @since 1.0.0
 */
class CPT {
	use Get_Instance;

	/**
	 * Post type name.
	 *
	 * @var string
	 */
	public $post_type;

	/**
	 * Post type labels.
	 *
	 * @since 1.0.0
	 * @var array<string, string>
	 */
	public $post_type_labels = [];

	/**
	 * Post type args.
	 *
	 * @since 1.0.0
	 * @var array<string, mixed>
	 */
	public $post_type_args = [];

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->post_type = AUTOAIB_CPT_CAMPAIGN;

		$this->post_type_labels = apply_filters(
			'autoaib_cpt_labels',
			[
				'name'               => esc_html_x( 'Campaigns', 'campaigns general name', 'auto-ai-blogger' ),
				'singular_name'      => esc_html_x( 'Campaign', 'campaign singular name', 'auto-ai-blogger' ),
				'search_items'       => esc_html__( 'Search Campaign', 'auto-ai-blogger' ),
				'all_items'          => esc_html__( 'Campaigns', 'auto-ai-blogger' ),
				'edit_item'          => esc_html__( 'Edit Campaign', 'auto-ai-blogger' ),
				'view_item'          => esc_html__( 'View Campaign', 'auto-ai-blogger' ),
				'add_new'            => esc_html__( 'Add New', 'auto-ai-blogger' ),
				'update_item'        => esc_html__( 'Update Campaign', 'auto-ai-blogger' ),
				'add_new_item'       => esc_html__( 'Add New', 'auto-ai-blogger' ),
				'new_item_name'      => esc_html__( 'New Campaign Name', 'auto-ai-blogger' ),
				'not_found'          => esc_html__( 'No space found', 'auto-ai-blogger' ),
				'not_found_in_trash' => esc_html__( 'No space found', 'auto-ai-blogger' ),
			]
		);

		$this->post_type_args = apply_filters(
			'autoaib_cpt_args',
			[
				'labels'              => $this->post_type_labels,
				'public'              => true,
				'show_ui'             => true,
				'show_in_menu'        => false,
				'query_var'           => true,
				'can_export'          => true,
				'show_in_admin_bar'   => false,
				'show_in_nav_menus'   => true,
				'exclude_from_search' => true,
				'has_archive'         => true,
				'show_in_rest'        => true,
				'rewrite'             => true,
				'map_meta_cap'        => true,
				'supports'            => [ 'title', 'slug' ],
				'capability_type'     => 'post',
			]
		);

		$this->create_cpt();
	}

	/**
	 * Function to initialize the CPT registration.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function create_cpt(): void {
		add_action( 'init', [ $this, 'register_post_type' ], 5 );
	}

	/**
	 * Register the post type for the plugin.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_post_type(): void {
		do_action( 'autoaib_before_register_' . $this->post_type . '_post_type' );

		$args = $this->post_type_args;

		register_post_type( $this->post_type, $args ); // @phpstan-ignore-line

		do_action( 'autoaib_after_register_' . $this->post_type . '_post_type' );
	}
}
