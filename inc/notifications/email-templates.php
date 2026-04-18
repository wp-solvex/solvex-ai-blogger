<?php
/**
 * Email Templates for Solvex AI Blogger Notifications.
 *
 * Provides HTML email templates for various notification types.
 *
 * @package auto-ai-blogger
 * @subpackage Inc\Notifications
 * @since 1.0.0
 */

namespace WPSolvex\AutoAIBlogger\Inc\Notifications;

use WPSolvex\AutoAIBlogger\Inc\Traits\Get_Instance;

defined( 'ABSPATH' ) || exit;

/**
 * Email Templates class.
 *
 * @package auto-ai-blogger
 * @subpackage Inc\Notifications
 * @since 1.0.0
 */
class Email_Templates {
	use Get_Instance;

	/**
	 * Get email template for notification type.
	 *
	 * @param string $notification_type Type of notification.
	 * @param array  $data Notification data.
	 * @return array|null Template data with 'subject' and 'body' keys.
	 * @since 1.0.0
	 */
	public function get_template( $notification_type, $data ): ?array {
		switch ( $notification_type ) {
			case 'campaign_started':
				return $this->campaign_started_template( $data );
			case 'post_created':
				return $this->post_created_template( $data );
			case 'campaign_completed':
				return $this->campaign_completed_template( $data );
			case 'campaign_failed':
				return $this->campaign_failed_template( $data );
			default:
				return null;
		}
	}

	/**
	 * Campaign Started email template.
	 *
	 * @param array $data Notification data.
	 * @return array Template data.
	 * @since 1.0.0
	 */
	private function campaign_started_template( $data ): array {
		$subject = sprintf(
			/* translators: %s: Campaign name */
			__( '🚀 Campaign Started: %s', 'auto-ai-blogger' ),
			$data['campaign_name']
		);

		$body  = $this->get_email_header();
		$body .= sprintf(
			'<h2 style="color: #4F46E5; margin-bottom: 16px; display: flex; gap: 4px; align-items: center;">%s</h2>',
			__( '🚀 Campaign Started Successfully!', 'auto-ai-blogger' )
		);

		$body .= sprintf(
			'<p style="font-size: 16px; line-height: 24px; color: #374151; margin-bottom: 24px;">%s</p>',
			sprintf(
				/* translators: %s: Campaign name */
				__( 'Your campaign "%s" has been started and the first post will be created soon.', 'auto-ai-blogger' ),
				esc_html( $data['campaign_name'] )
			)
		);

		$body .= '<div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">';
		$body .= '<h3 style="font-size: 14px; font-weight: 600; color: #6B7280; margin-bottom: 12px; text-transform: uppercase;">' . __( 'Campaign Details', 'auto-ai-blogger' ) . '</h3>';

		$body .= $this->get_detail_row( __( 'Campaign Name', 'auto-ai-blogger' ), esc_html( $data['campaign_name'] ) );
		$body .= $this->get_detail_row( __( 'Target Posts', 'auto-ai-blogger' ), esc_html( $data['target_posts'] ) );
		$body .= $this->get_detail_row( __( 'Frequency', 'auto-ai-blogger' ), esc_html( $data['frequency'] ) );
		$body .= $this->get_detail_row( __( 'Keywords', 'auto-ai-blogger' ), esc_html( $data['keywords'] ) );

		$body .= '</div>';

		$body .= $this->get_action_button(
			__( 'View Campaign', 'auto-ai-blogger' ),
			esc_url( $data['campaign_url'] )
		);

		$body .= $this->get_email_footer();

		return [
			'subject' => $subject,
			'body'    => $body,
		];
	}

	/**
	 * Post Created email template.
	 *
	 * @param array $data Notification data.
	 * @return array Template data.
	 * @since 1.0.0
	 */
	private function post_created_template( $data ): array {
		$subject = sprintf(
			/* translators: %s: Post title */
			__( '✅ New Post Created: %s', 'auto-ai-blogger' ),
			$data['post_title']
		);

		$body  = $this->get_email_header();
		$body .= sprintf(
			'<h2 style="color: #10B981; margin-bottom: 16px; display: flex; gap: 4px; align-items: center;">%s</h2>',
			__( '✅ New Post Created Successfully!', 'auto-ai-blogger' )
		);

		$body .= sprintf(
			'<p style="font-size: 16px; line-height: 24px; color: #374151; margin-bottom: 24px;">%s</p>',
			sprintf(
				/* translators: %s: Campaign name */
				__( 'A new post has been created from your campaign "%s".', 'auto-ai-blogger' ),
				esc_html( $data['campaign_name'] )
			)
		);

		$body .= '<div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">';
		$body .= '<h3 style="font-size: 14px; font-weight: 600; color: #6B7280; margin-bottom: 12px; text-transform: uppercase;">' . __( 'Post Details', 'auto-ai-blogger' ) . '</h3>';

		$body .= $this->get_detail_row( __( 'Post Title', 'auto-ai-blogger' ), esc_html( $data['post_title'] ) );
		$body .= $this->get_detail_row( __( 'Post Number', 'auto-ai-blogger' ), sprintf( '#%d', $data['post_number'] ) );
		$body .= $this->get_detail_row( __( 'Campaign Progress', 'auto-ai-blogger' ), sprintf( '%d / %d posts', $data['posts_created'], $data['posts_target'] ) );

		$body .= '</div>';

		$body .= '<div style="display: flex; gap: 12px; margin-bottom: 24px;">';
		$body .= $this->get_action_button(
			__( 'View Post', 'auto-ai-blogger' ),
			esc_url( $data['post_url'] ),
			'#10B981'
		);
		$body .= $this->get_action_button(
			__( 'Edit Post', 'auto-ai-blogger' ),
			esc_url( $data['edit_url'] ),
			'#6B7280'
		);
		$body .= '</div>';

		$body .= $this->get_email_footer();

		return [
			'subject' => $subject,
			'body'    => $body,
		];
	}

	/**
	 * Campaign Completed email template.
	 *
	 * @param array $data Notification data.
	 * @return array Template data.
	 * @since 1.0.0
	 */
	private function campaign_completed_template( $data ): array {
		$subject = sprintf(
			/* translators: %s: Campaign name */
			__( '🎉 Campaign Completed: %s', 'auto-ai-blogger' ),
			$data['campaign_name']
		);

		$body  = $this->get_email_header();
		$body .= sprintf(
			'<h2 style="color: #8B5CF6; margin-bottom: 16px; display: flex; gap: 4px; align-items: center;">%s</h2>',
			__( '🎉 Campaign Completed Successfully!', 'auto-ai-blogger' )
		);

		$body .= sprintf(
			'<p style="font-size: 16px; line-height: 24px; color: #374151; margin-bottom: 24px;">%s</p>',
			sprintf(
				/* translators: %s: Campaign name */
				__( 'Congratulations! Your campaign "%s" has been completed successfully.', 'auto-ai-blogger' ),
				esc_html( $data['campaign_name'] )
			)
		);

		$body .= '<div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">';
		$body .= '<h3 style="font-size: 14px; font-weight: 600; color: #6B7280; margin-bottom: 12px; text-transform: uppercase;">' . __( 'Campaign Summary', 'auto-ai-blogger' ) . '</h3>';

		$body .= $this->get_detail_row( __( 'Campaign Name', 'auto-ai-blogger' ), esc_html( $data['campaign_name'] ) );
		$body .= $this->get_detail_row( __( 'Total Posts Created', 'auto-ai-blogger' ), sprintf( '%d / %d', $data['posts_created'], $data['posts_target'] ) );
		$body .= $this->get_detail_row( __( 'Completion Time', 'auto-ai-blogger' ), esc_html( $data['completion_time'] ) );
		$body .= $this->get_detail_row( __( 'Status', 'auto-ai-blogger' ), __( 'Completed', 'auto-ai-blogger' ) );

		$body .= '</div>';

		$body .= $this->get_action_button(
			__( 'View Campaign', 'auto-ai-blogger' ),
			esc_url( $data['campaign_url'] )
		);

		$body .= $this->get_email_footer();

		return [
			'subject' => $subject,
			'body'    => $body,
		];
	}

	/**
	 * Campaign Failed email template.
	 *
	 * @param array $data Notification data.
	 * @return array Template data.
	 * @since 1.0.0
	 */
	private function campaign_failed_template( $data ): array {
		$subject = sprintf(
			/* translators: %s: Campaign name */
			__( '⚠️ Campaign Failed: %s', 'auto-ai-blogger' ),
			$data['campaign_name']
		);

		$body  = $this->get_email_header();
		$body .= sprintf(
			'<h2 style="color: #EF4444; margin-bottom: 16px; display: flex; gap: 4px; align-items: center;">%s</h2>',
			__( '⚠️ Campaign Failed/Terminated', 'auto-ai-blogger' )
		);

		$body .= sprintf(
			'<p style="font-size: 16px; line-height: 24px; color: #374151; margin-bottom: 24px;">%s</p>',
			sprintf(
				/* translators: %s: Campaign name */
				__( 'Your campaign "%s" has been terminated due to multiple failures.', 'auto-ai-blogger' ),
				esc_html( $data['campaign_name'] )
			)
		);

		$body .= '<div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 8px; padding: 20px; margin-bottom: 24px;">';
		$body .= '<h3 style="font-size: 14px; font-weight: 600; color: #991B1B; margin-bottom: 12px; text-transform: uppercase;">' . __( 'Failure Details', 'auto-ai-blogger' ) . '</h3>';

		$body .= $this->get_detail_row( __( 'Campaign Name', 'auto-ai-blogger' ), esc_html( $data['campaign_name'] ), '#DC2626' );
		$body .= $this->get_detail_row( __( 'Posts Created', 'auto-ai-blogger' ), sprintf( '%d / %d', $data['posts_created'], $data['posts_target'] ), '#DC2626' );
		$body .= $this->get_detail_row( __( 'Posts Failed', 'auto-ai-blogger' ), esc_html( $data['posts_failed'] ), '#DC2626' );
		$body .= $this->get_detail_row( __( 'Reason', 'auto-ai-blogger' ), esc_html( $data['failure_reason'] ), '#DC2626' );

		$body .= '</div>';

		$body .= '<p style="font-size: 14px; line-height: 20px; color: #6B7280; margin-bottom: 24px;">' . __( 'Please review your campaign settings and try again. Check your API credits, keywords, and campaign configuration.', 'auto-ai-blogger' ) . '</p>';

		$body .= $this->get_action_button(
			__( 'Review Campaign', 'auto-ai-blogger' ),
			esc_url( $data['campaign_url'] ),
			'#EF4444'
		);

		$body .= $this->get_email_footer();

		return [
			'subject' => $subject,
			'body'    => $body,
		];
	}

	/**
	 * Get email header HTML.
	 *
	 * @return string Email header HTML.
	 * @since 1.0.0
	 */
	private function get_email_header(): string {
		$site_name = get_bloginfo( 'name' );

		return '
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>' . esc_html( $site_name ) . ' - ' . __( 'Solvex AI Blogger Notification', 'auto-ai-blogger' ) . '</title>
		</head>
		<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; background-color: #F9FAFB;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F9FAFB;">
				<tr>
					<td style="padding: 40px 20px;">
						<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
							<tr>
								<td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 40px; text-align: center;">
									<h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700;">' . esc_html( $site_name ) . '</h1>
									<p style="margin: 8px 0 0 0; color: #E0E7FF; font-size: 14px;">' . __( 'Solvex AI Blogger', 'auto-ai-blogger' ) . '</p>
								</td>
							</tr>
							<tr>
								<td style="padding: 40px;">
		';
	}

	/**
	 * Get email footer HTML.
	 *
	 * @return string Email footer HTML.
	 * @since 1.0.0
	 */
	private function get_email_footer(): string {
		$site_name = get_bloginfo( 'name' );
		$site_url  = get_bloginfo( 'url' );

		return '
								</td>
							</tr>
							<tr>
								<td style="background-color: #F9FAFB; padding: 32px 40px; border-top: 1px solid #E5E7EB;">
									<p style="margin: 0 0 12px 0; font-size: 14px; color: #6B7280; text-align: center;">' . __( 'You are receiving this notification because you have enabled notifications for Solvex AI Blogger.', 'auto-ai-blogger' ) . '</p>
									<p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
										© ' . gmdate( 'Y' ) . ' <a href="' . esc_url( $site_url ) . '" style="color: #4F46E5; text-decoration: none;">' . esc_html( $site_name ) . '</a>. ' . __( 'All rights reserved.', 'auto-ai-blogger' ) . '
									</p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
		</html>
		';
	}

	/**
	 * Get detail row HTML.
	 *
	 * @param string $label Detail label.
	 * @param string $value Detail value.
	 * @param string $color Text color (optional).
	 * @return string Detail row HTML.
	 * @since 1.0.0
	 */
	private function get_detail_row( $label, $value, $color = '#374151' ): string {
		return sprintf(
			'<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
				<span style="font-size: 14px; color: #6B7280;">%s:</span>
				<span style="font-size: 14px; font-weight: 600; color: %s;">%s</span>
			</div>',
			esc_html( $label ),
			esc_attr( $color ),
			$value
		);
	}

	/**
	 * Get action button HTML.
	 *
	 * @param string $text Button text.
	 * @param string $url Button URL.
	 * @param string $color Button color (optional).
	 * @return string Button HTML.
	 * @since 1.0.0
	 */
	private function get_action_button( $text, $url, $color = '#4F46E5' ): string {
		return sprintf(
			'<a href="%s" style="display: inline-block; padding: 12px 32px; background-color: %s; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;">%s</a>',
			esc_url( $url ),
			esc_attr( $color ),
			esc_html( $text )
		);
	}
}
