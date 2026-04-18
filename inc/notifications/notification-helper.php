<?php
/**
 * Notification Helper class for Solvex AI Blogger.
 *
 * Handles sending notifications via email for campaign events.
 *
 * @package solvex-ai-blogger
 * @subpackage Inc\Notifications
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Inc\Notifications;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;
use WPSolvex\AutoAIBlogger\Inc\Utils\Helper;

defined( 'ABSPATH' ) || exit;

/**
 * Notification Helper class.
 *
 * @package solvex-ai-blogger
 * @subpackage Inc\Notifications
 * @since 1.0.0
 */
class Notification_Helper {
	use Get_Instance;

	/**
	 * Constructor.
	 */
	protected function __construct() {
		// Initialize hooks for notifications.
		$this->init_hooks();
	}

	/**
	 * Handle Campaign Started notification.
	 *
	 * @param int   $campaign_id Campaign ID.
	 * @param array $campaign_data Campaign data.
	 * @since 1.0.0
	 */
	public function handle_campaign_started( $campaign_id, $campaign_data ): void {
		if ( ! $this->are_notifications_enabled() ) {
			return;
		}

		$campaign = get_post( $campaign_id );
		if ( ! $campaign ) {
			return;
		}

		$data = [
			'campaign_id'   => $campaign_id,
			'campaign_name' => $campaign->post_title,
			'target_posts'  => $campaign_data['postsTarget'] ?? 0,
			'frequency'     => $this->format_frequency( $campaign_data ),
			'keywords'      => is_array( $campaign_data['keywords'] ?? null ) ? implode( ', ', $campaign_data['keywords'] ) : ( $campaign_data['keywords'] ?? '' ),
			'campaign_url'  => admin_url( 'admin.php?page=solvex-ai-blogger&path=campaigns&id=' . $campaign_id ),
		];

		$this->send_notification( 'campaign_started', $data );
	}

	/**
	 * Handle Post Created Successfully notification.
	 *
	 * @param int   $campaign_id Campaign ID.
	 * @param int   $post_id Post ID.
	 * @param array $post_data Post data.
	 * @since 1.0.0
	 */
	public function handle_post_created( $campaign_id, $post_id, $post_data ): void {
		if ( ! $this->are_notifications_enabled() ) {
			return;
		}

		$campaign = get_post( $campaign_id );
		$post     = get_post( $post_id );

		if ( ! $campaign || ! $post ) {
			return;
		}

		$data = [
			'campaign_id'   => $campaign_id,
			'campaign_name' => $campaign->post_title,
			'post_id'       => $post_id,
			'post_title'    => $post->post_title,
			'post_number'   => $post_data['post_number'] ?? 0,
			'posts_created' => $post_data['posts_created'] ?? 0,
			'posts_target'  => $post_data['posts_target'] ?? 0,
			'post_url'      => get_permalink( $post_id ),
			'edit_url'      => admin_url( 'post.php?post=' . $post_id . '&action=edit' ),
			'campaign_url'  => admin_url( 'admin.php?page=solvex-ai-blogger&path=campaigns&id=' . $campaign_id ),
		];

		$this->send_notification( 'post_created', $data );
	}

	/**
	 * Handle Campaign Completed notification.
	 *
	 * @param int    $campaign_id Campaign ID.
	 * @param string $reason Completion reason.
	 * @param array  $campaign_data Campaign data.
	 * @since 1.0.0
	 */
	public function handle_campaign_completed( $campaign_id, $reason, $campaign_data ): void {
		if ( ! $this->are_notifications_enabled() ) {
			return;
		}

		$campaign = get_post( $campaign_id );
		if ( ! $campaign ) {
			return;
		}

		$data = [
			'campaign_id'       => $campaign_id,
			'campaign_name'     => $campaign->post_title,
			'posts_created'     => $campaign_data['posts_created'] ?? 0,
			'posts_target'      => $campaign_data['posts_target'] ?? 0,
			'completion_reason' => $reason,
			'completion_time'   => current_time( 'mysql' ),
			'campaign_url'      => admin_url( 'admin.php?page=solvex-ai-blogger&path=campaigns&id=' . $campaign_id ),
		];

		$this->send_notification( 'campaign_completed', $data );
	}

	/**
	 * Handle Campaign Failed/Terminated notification.
	 *
	 * @param int    $campaign_id Campaign ID.
	 * @param string $reason Failure reason.
	 * @param array  $campaign_data Campaign data.
	 * @since 1.0.0
	 */
	public function handle_campaign_failed( $campaign_id, $reason, $campaign_data ): void {
		if ( ! $this->are_notifications_enabled() ) {
			return;
		}

		$campaign = get_post( $campaign_id );
		if ( ! $campaign ) {
			return;
		}

		$data = [
			'campaign_id'    => $campaign_id,
			'campaign_name'  => $campaign->post_title,
			'posts_created'  => $campaign_data['posts_created'] ?? 0,
			'posts_target'   => $campaign_data['posts_target'] ?? 0,
			'posts_failed'   => $campaign_data['posts_failed'] ?? 0,
			'failure_reason' => $reason,
			'failure_time'   => current_time( 'mysql' ),
			'campaign_url'   => admin_url( 'admin.php?page=solvex-ai-blogger&path=campaigns&id=' . $campaign_id ),
		];

		$this->send_notification( 'campaign_failed', $data );
	}

	/**
	 * Initialize notification hooks.
	 *
	 * @since 1.0.0
	 */
	private function init_hooks(): void {
		// Campaign Started.
		add_action( 'solvex_aib_campaign_started', [ $this, 'handle_campaign_started' ], 10, 2 );

		// Post Created Successfully.
		add_action( 'solvex_aib_post_created_successfully', [ $this, 'handle_post_created' ], 10, 3 );

		// Campaign Completed.
		add_action( 'solvex_aib_campaign_completed', [ $this, 'handle_campaign_completed' ], 10, 3 );

		// Campaign Failed/Terminated.
		add_action( 'solvex_aib_campaign_failed', [ $this, 'handle_campaign_failed' ], 10, 3 );
	}

	/**
	 * Send notification via enabled channels.
	 *
	 * @param string $notification_type Type of notification.
	 * @param array  $data Notification data.
	 * @since 1.0.0
	 */
	private function send_notification( $notification_type, $data ): void {
		// Send email notification.
		if ( $this->is_email_enabled() ) {
			$this->send_email_notification( $notification_type, $data );
		}
	}

	/**
	 * Send email notification.
	 *
	 * @param string $notification_type Type of notification.
	 * @param array  $data Notification data.
	 * @since 1.0.0
	 */
	private function send_email_notification( $notification_type, $data ): void {
		$email_addresses = $this->get_email_addresses();
		if ( empty( $email_addresses ) ) {
			return;
		}

		$email_templates = Email_Templates::get_instance();
		$template_data   = $email_templates->get_template( $notification_type, $data );

		if ( ! $template_data ) {
			return;
		}

		$headers = [
			'Content-Type: text/html; charset=UTF-8',
			'From: ' . get_bloginfo( 'name' ) . ' <' . get_bloginfo( 'admin_email' ) . '>',
		];

		foreach ( $email_addresses as $email ) {
			wp_mail(
				$email,
				$template_data['subject'],
				$template_data['body'],
				$headers
			);
		}
	}

	/**
	 * Check if any notifications are enabled.
	 *
	 * @return bool True if enabled.
	 * @since 1.0.0
	 */
	private function are_notifications_enabled(): bool {
		return $this->is_email_enabled();
	}

	/**
	 * Check if email notifications are enabled.
	 *
	 * @return bool True if enabled.
	 * @since 1.0.0
	 */
	private function is_email_enabled(): bool {
		$enabled = Helper::get_option( 'emailNotificationEnabled', false );
		$value   = Helper::get_option( 'emailNotificationValue', '' );
		return $enabled && ! empty( $value );
	}

	/**
	 * Get email addresses for notifications.
	 *
	 * @return array Email addresses.
	 * @since 1.0.0
	 */
	private function get_email_addresses(): array {
		$email_value = Helper::get_option( 'emailNotificationValue', '' );
		if ( empty( $email_value ) ) {
			return [];
		}

		// Split by comma and clean up.
		$emails = array_map( 'trim', explode( ',', $email_value ) );
		return array_filter( $emails, 'is_email' );
	}

	/**
	 * Format frequency for display.
	 *
	 * @param array $campaign_data Campaign data.
	 * @return string Formatted frequency.
	 * @since 1.0.0
	 */
	private function format_frequency( $campaign_data ): string {
		$interval = $campaign_data['repeatInterval'] ?? 1;
		$unit     = $campaign_data['repeatUnit'] ?? 'day';

		$unit_labels = [
			'hour'  => _n( 'hour', 'hours', $interval, 'solvex-ai-blogger' ),
			'day'   => _n( 'day', 'days', $interval, 'solvex-ai-blogger' ),
			'week'  => _n( 'week', 'weeks', $interval, 'solvex-ai-blogger' ),
			'month' => _n( 'month', 'months', $interval, 'solvex-ai-blogger' ),
		];

		$unit_label = $unit_labels[ $unit ] ?? $unit;

		return sprintf(
			/* translators: 1: interval number, 2: unit label */
			__( 'Every %1$d %2$s', 'solvex-ai-blogger' ),
			$interval,
			$unit_label
		);
	}
}
