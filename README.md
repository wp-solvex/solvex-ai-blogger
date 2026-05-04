# Solvex AI Blogger #

**Contributors:** [wpsolvex](https://profiles.wordpress.org/wpsolvex/)  
**Tags:** blog, blogging, content creation, auto blogging, ai  
**Tested up to:** 6.9  
**Stable tag:** 1.0.0  
**License:** GPLv2 or later  
**License URI:** http://www.gnu.org/licenses/gpl-2.0.html  
**Requires at least:** 6.7  
**Requires PHP:** 7.4  

Beyond ordinary content creators — experience true AI‑driven auto‑blogging.

## Description ##

Not just another content creator — experience AI‑powered auto‑blogging like never before.

## External Services ##

This plugin connects to several third-party services. Each is documented below with what is sent, when it is sent, and the relevant Terms of Service and Privacy Policy.

### WP AI Blogger API

The plugin's core content-generation features are powered by the WP AI Blogger service, operated by WP Solvex. The service is required for the plugin to function.

**What the service is used for:**
- Generating AI-based blog post content from a provided post title
- Generating campaign-based blog posts using user-defined keywords, configuration, and safety settings
- Retrieving token quota and usage information for the user's license

User name and email address are collected only when the user explicitly provides consent. If consent is not provided, we do not collect or process any personal user data.

**Service provider:** WP AI Blogger (WP Solvex), API domain: https://wpaiblogger.com

**Terms and Privacy Policy:**
- Terms of Service: https://wpaiblogger.com/terms-and-conditions/
- Privacy Policy: https://wpaiblogger.com/privacy-policy/

### Image downloads (Unsplash and Pixabay)

When the WP AI Blogger API returns generated post content, the response may include one or more image URLs. These URLs point to assets hosted on the Unsplash and Pixabay content delivery networks. The plugin fetches each image URL with `wp_remote_get` and sideloads the image into the WordPress Media Library so it can be attached to the generated post.

**What data is sent:** An HTTP GET request to the returned image URL. No user data is transmitted in the request body. The request includes a User-Agent header identifying the plugin version and the WordPress version.

**When:** During post generation (foreground, triggered by the administrator) and during scheduled campaign runs (background, triggered by WP-Cron).

**Service provider:** Unsplash
API domain: https://images.unsplash.com (and related Unsplash CDN hosts)

**Service provider:** Pixabay
API domain: https://pixabay.com (and related Pixabay CDN hosts)

## Installation ##

1. Upload the plugin files to the `/wp-content/plugins/solvex-ai-blogger` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.

## Changelog ##

### 1.0.0 ###
* Initial release
