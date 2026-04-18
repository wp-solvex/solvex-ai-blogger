# Solvex AI Blogger #

**Contributors:** [wpsolvex](https://profiles.wordpress.org/wpsolvex/)  
**Tags:** blog, blogging, content creation, auto blogging, ai  
**Tested up to:** 6.9  
**Stable tag:** 0.0.4  
**License:** GPLv2 or later  
**License URI:** http://www.gnu.org/licenses/gpl-2.0.html  

Beyond ordinary content creators — experience true AI‑driven auto‑blogging.

## Description ##

Not just another content creator — experience AI‑powered auto‑blogging like never before.

## External Services ##

This plugin relies on an external service operated by WP AI Blogger (WP Solvex) to provide AI-powered content generation features.

The external service is required for the core functionality of the plugin, including generating blog posts and managing token usage.

### What the service is used for
- Generating AI-based blog post content from post titles
- Generating campaign-based blog posts using user-defined keywords and configurations
- Generating post content from a provided title
- Retrieving token usage and license detail

### What data is sent and when
The plugin sends data to the external service only when initiated by the site administrator. Depending on the feature used, this may include:
- Post titles, keywords, and campaign configuration entered by the user
- Site metadata such as site title and site description (used to improve content relevance)
- Plugin license key and token usage identifiers
- Technical information such as plugin version and WordPress version

User name and email address are collected only when the user explicitly provides consent.
If consent is not provided, we do not collect or process any personal user data.

### Service provider
The external service is provided by:

WP AI Blogger (WP Solvex)
API domain: https://wpaiblogger.com

### Terms and Privacy Policy
- Terms of Service: https://wpaiblogger.com/terms-and-conditions/
- Privacy Policy: https://wpaiblogger.com/privacy-policy/

### SureCart (License Management)

This plugin uses the SureCart API for license activation, deactivation, and verification.

**What the service is used for:**
- Activating and deactivating the plugin license key
- Verifying the license status

**What data is sent and when:**
- The plugin license key and site URL are sent when the site administrator activates, deactivates, or verifies the license.

**Service provider:**
SureCart
API domain: https://api.surecart.com

**Terms and Privacy Policy:**
- Terms and Conditions: https://surecart.com/terms-and-conditions/
- Privacy Policy: https://surecart.com/privacy-policy/

## Third-Party Libraries ##

This plugin bundles the following JavaScript libraries for its admin dashboard interface:

- **React Router** — Used for client-side navigation within the plugin's single-page admin dashboard. Any references to `reactrouter.com` found in the compiled JavaScript files are documentation URLs embedded within the library source code and are not runtime API calls or external service connections.

## Screenshots ##
1. Admin screen.

## Installation ##

1. Upload the plugin files to the `/wp-content/plugins/solvex-ai-blogger` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.

## Source Code ##

The uncompiled source code for the plugin's JavaScript and CSS is located in the `src/` directory. The compiled output is in `assets/build/`.

The full source code is publicly available on GitHub:
https://github.com/wp-solvex/solvex-ai-blogger

To build the plugin assets from source:
1. Run `npm install` to install dependencies.
2. Run `npm run build` to compile the production assets.

The plugin uses `@wordpress/scripts` (webpack) as its build tool.

## Changelog ##

### 0.0.4 ###
* Improvement: Renamed plugin from "Auto AI Blogger" to "Solvex AI Blogger" per WordPress Plugin Review Team feedback.

### 0.0.3 ###
* Improvement: Documented SureCart licensing service and third-party libraries in readme.
* Improvement: Added source code repository link and build instructions in readme.
* Security: Improved nonce verification flow in license activation with early returns.
* Security: Enhanced input sanitization for AJAX settings and campaign handlers.
* Security: Added json_last_error() checks for all JSON decode operations.
* Security: Improved CSS output escaping in licensing settings.
* Fix: Removed hardcoded AJAX URL fallbacks in JavaScript source files.
* Fix: Renamed generic JavaScript object name to use plugin prefix.

### 0.0.2 ###
* Improvement: Feedback as per WordPress plugin review team has been implemented.

### 0.0.1 ###
* Initial release
