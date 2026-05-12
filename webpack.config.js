// Load the default @wordpress/scripts config object
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

// Use the defaultConfig but replace the entry and output properties.
module.exports = {
	...defaultConfig,
	mode: 'production',
	optimization: {
		usedExports: true,
	},
	entry: {
		'blog-app': path.resolve( __dirname, 'src/dashboard/App.js' ),
	},
	resolve: {
		extensions: [ ...( defaultConfig.resolve.extensions || [ '.js', '.json' ] ), '.jsx' ],
		alias: {
			...defaultConfig.resolve.alias,
			'@AdminRoot': path.resolve( __dirname, 'src/dashboard' ),
			'@DashboardApp': path.resolve( __dirname, 'src/dashboard/App' ),
			'@Store': path.resolve( __dirname, 'src/dashboard/Store' ),
			'@Utils': path.resolve( __dirname, 'src/dashboard/Utils' ),
			'@Components': path.resolve( __dirname, 'src/dashboard/App/Components' ),
			'@WizardSteps': path.resolve( __dirname, 'src/dashboard/App/Wizard/Steps' ),
			'@WizardFields': path.resolve( __dirname, 'src/dashboard/App/Wizard/Fields' ),
			'@AppImages': path.resolve( __dirname, 'src/dashboard/App/Images' ),
			'@Elements': path.resolve( __dirname, 'src/dashboard/App/Elements' ),
		},
	},
	output: {
		...defaultConfig.output,
		filename: '[name].js',
		path: path.resolve( __dirname, 'assets/build' ),
	},
	performance: {
		hints: 'warning', // Performance warnings.
	},
};
