module.exports = {
	content: [ './src/dashboard/**/*.{js,jsx,ts,tsx}' ],
	theme: {
		extend: {
			colors: {
				wpprimary: 'var(--wp-admin-theme-color)',
				wpcolor: '#2271b1',
				wphovercolor: '#135e96',
				wphoverbgcolor: '#2271b117',
				wpcolorfaded: '#2271b120',
				required_icon_color: '#EF4444',
				// Legacy blogapp colors (updated to brand purple for consistency)
				blogapp: {
					DEFAULT: '#9138c8', // Brand purple
					hover: '#7a2db0', // Brand purple hover
				},
				// New brand color - Purple (#9138c8)
				brand: {
					DEFAULT: '#9138c8',
					50: '#faf5ff',
					100: '#f3e8ff',
					200: '#e9d5ff',
					300: '#d8b4fe',
					400: '#c084fc',
					500: '#9138c8', // Primary brand color
					600: '#7a2db0', // Hover state
					700: '#6b21a8',
					800: '#581c87',
					900: '#3b0764',
					hover: '#7a2db0',
					light: '#a855f7',
					dark: '#6b21a8',
				},
				primary: {
					25: '#F5FAFF', // Very light blue
					50: '#EAF4FF', // Lightest blue
					100: '#CDE5FF', // Light pastel blue
					200: '#A8D2FF', // Soft sky blue
					300: '#82BFFF', // Light blue
					400: '#5DABFF', // Mid blue
					500: '#3897FF', // Primary blue
					600: '#2078E5', // Darker blue
					700: '#1858AE', // Deep blue
					800: '#15488C', // Navy shade
					900: '#103669', // Dark navy
				},
			},
			fontFamily: {
				inter: [ '"Inter"', 'sans-serif' ],
			},
			screens: {
				tablet: { max: '782px' },
				// => @media (max-width: 782px) { ... }
				mobile: { max: '600px' },
				// => @media (max-width: 600px) { ... }
			},
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
	corePlugins: {
		preflight: false,
	},
};
