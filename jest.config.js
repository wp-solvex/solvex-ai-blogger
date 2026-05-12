/**
 * Jest configuration — extends wp-scripts defaults and adds the webpack
 * module aliases so test files can import from `@Utils`, `@Components`, etc.
 */
const path = require( 'path' );
const defaults = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...defaults,
	rootDir: __dirname,
	testMatch: [ '<rootDir>/tests/js/**/*.test.js' ],
	moduleNameMapper: {
		'^@AdminRoot/(.*)$': '<rootDir>/src/dashboard/$1',
		'^@DashboardApp/(.*)$': '<rootDir>/src/dashboard/App/$1',
		'^@Store/(.*)$': '<rootDir>/src/dashboard/Store/$1',
		'^@Utils/(.*)$': '<rootDir>/src/dashboard/Utils/$1',
		'^@Components/(.*)$': '<rootDir>/src/dashboard/App/Components/$1',
		'^@Elements/(.*)$': '<rootDir>/src/dashboard/App/Elements/$1',
		'^@WizardSteps/(.*)$': '<rootDir>/src/dashboard/App/Wizard/Steps/$1',
		'^@WizardFields/(.*)$': '<rootDir>/src/dashboard/App/Wizard/Fields/$1',
		'^@AppImages/(.*)$': '<rootDir>/src/dashboard/App/Images/$1',
		'\\.(scss|css|svg)$': '<rootDir>/tests/js/__mocks__/styleMock.js',
	},
};
