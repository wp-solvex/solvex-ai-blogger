=== Solvex AI Blogger ===

Contributors: wpsolvex
Tags: blog, blogging, content creation, auto blogging, ai
Tested up to: 6.9
Stable tag: 0.0.5
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Beyond ordinary content creators — experience true AI‑driven auto‑blogging.

== Description ==

Not just another content creator — experience AI‑powered auto‑blogging like never before.

== External Services ==

This plugin connects to several third-party services. Each is documented below with what is sent, when it is sent, and the relevant Terms of Service and Privacy Policy.

### WP AI Blogger API (wpaiblogger.com)

The plugin's core content-generation features are powered by the WP AI Blogger service, operated by WP Solvex. The service is required for the plugin to function.

**What the service is used for:**
- Generating AI-based blog post content from a provided post title
- Generating campaign-based blog posts using user-defined keywords, configuration, and safety settings
- Retrieving token quota and usage information for the user's license

**Endpoints called and when:**
- `POST https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/generate-content-from-title` — called when the site administrator triggers generation of a single post. Sends the post title, safety settings, and a temperature value.
- `POST https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/generate-campaign-post` — called when a campaign runs (manually or via cron). Sends the user-selected keywords, word/title limits, safety settings, desired image count, site title, and site description.
- `GET https://wpaiblogger.com/wp-json/wp-ai-blogger/v1/get-token-data?license=...` — called to refresh the user's token quota and usage. Sends the plugin license key.

**What data is sent:**
- Post titles, keywords, and campaign configuration entered by the site administrator
- Site metadata such as site title and site description (used to improve content relevance)
- The plugin license key and token usage identifiers
- Technical information such as plugin version and WordPress version (sent as the User-Agent header)

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
- Terms of Service: https://unsplash.com/terms
- Privacy Policy: https://unsplash.com/privacy

**Service provider:** Pixabay
API domain: https://pixabay.com (and related Pixabay CDN hosts)
- Terms of Service: https://pixabay.com/service/terms/
- Privacy Policy: https://pixabay.com/service/privacy/

### SureCart (License Management)

This plugin uses the SureCart API for license activation, deactivation, and verification.

**What the service is used for:**
- Activating and deactivating the plugin license key
- Verifying the current license status

**What data is sent and when:**
- The plugin license key and site URL are sent when the site administrator activates, deactivates, or verifies the license.

**Service provider:** SureCart, API domain: https://api.surecart.com

**Terms and Privacy Policy:**
- Terms and Conditions: https://surecart.com/terms-and-conditions/
- Privacy Policy: https://surecart.com/privacy-policy/

== Third-Party Libraries ==

This plugin bundles the following JavaScript libraries for its admin dashboard interface:

- **React Router** — Used for client-side navigation within the plugin's single-page admin dashboard. Any references to `reactrouter.com` found in the compiled JavaScript files are documentation URLs embedded within the library source code and are not runtime API calls or external service connections.

== Screenshots ==
1. Admin screen.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/solvex-ai-blogger` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.

== Source Code ==

The uncompiled source code for the plugin's JavaScript and CSS is located in the `src/` directory. The compiled output is in `assets/build/`.

The full source code is publicly available on GitHub:
https://github.com/wp-solvex/solvex-ai-blogger

To build the plugin assets from source:
1. Run `npm install` to install dependencies.
2. Run `npm run build` to compile the production assets.

The plugin uses `@wordpress/scripts` (webpack) as its build tool.

== Changelog ==

= 0.0.5 =
* Improvement: Renamed plugin main file to `solvex-ai-blogger.php` and corrected the Text Domain to match the plugin slug per WordPress Plugin Review Team feedback.
* Improvement: Renamed all internal PHP constants and JavaScript identifiers from `AUTOAIB_`/`autoaib_` to `SOLVEX_AIB_`/`solvex_aib_` for consistency with the plugin name.
* Improvement: Changed the plugin settings option key from `autoaib_settings` to `solvex_aib_settings`; previous settings on test installs must be reconfigured.
* Improvement: Changed the REST API namespace from `/autoaib/v1/` to `/solvex-ai-blogger/v1/`.
* Improvement: Expanded the External Services disclosure in readme.txt to cover the token-usage endpoint, image downloads, and the Unsplash and Pixabay CDNs image URLs resolve to.
* Security: Simplified the REST settings-update permission check to require `manage_options` only (removed the redundant `edit_posts` check).
* Fix: Resolved all `WordPress.WP.I18n.TextDomainMismatch` sniff errors by replacing the old `auto-ai-blogger` text domain with `solvex-ai-blogger`.

= 0.0.4 =
* Improvement: Renamed plugin from "Auto AI Blogger" to "Solvex AI Blogger" per WordPress Plugin Review Team feedback.

= 0.0.3 =
* Improvement: Documented SureCart licensing service and third-party libraries in readme.
* Improvement: Added source code repository link and build instructions in readme.
* Security: Improved nonce verification flow in license activation with early returns.
* Security: Enhanced input sanitization for AJAX settings and campaign handlers.
* Security: Added json_last_error() checks for all JSON decode operations.
* Security: Improved CSS output escaping in licensing settings.
* Fix: Removed hardcoded AJAX URL fallbacks in JavaScript source files.
* Fix: Renamed generic JavaScript object name to use plugin prefix.

= 0.0.2 =
* Improvement: Feedback as per WordPress plugin review team has been implemented.

= 0.0.1 =
* Initial release
