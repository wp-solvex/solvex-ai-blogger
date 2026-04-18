module.exports = function (grunt) {
	var autoprefixer = require('autoprefixer');
    var flexibility = require('postcss-flexibility');

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		copy: {
			main: {
				options: {
					mode: true,
				},
				src: [
					'**',
					'!.git/**',
					'!.gitignore',
					'!.gitattributes',
					'!*.sh',
					'!*.zip',
					'!eslintrc.json',
					'!README.md',
					'!Gruntfile.js',
					'!package.json',
					'!package-lock.json',
					'!composer.json',
					'!composer.lock',
					'!phpcs.xml',
					'!phpcs.xml.dist',
					'!phpunit.xml.dist',
					'!node_modules/**',
					'!vendor/**',
					'!tests/**',
					'!scripts/**',
					'!config/**',
					'!tests/**',
					'!bin/**',
					'!claude/**',
					'!claudeignore/**',
					'!artifact/**',
					'!assets/css/unminified/**',
					'!assets/js/unminified/**',
					'!assets/fonts/google-fonts.json',
					'!assets/src/**',
					'!phpstan.neon',
					'!phpstan-baseline.neon',
					'!tailwind.config.js',
					'!webpack.config.js',
					'!postcss.config.js',
					'!.DS_Store',
					'!phpinsights.php',
					// '!src/**',
					'!copilot_readme/**',
					'!debug_tokens.js'
				],
				dest: 'auto-ai-blogger/',
			},
		},
		compress: {
			main: {
				options: {
					archive: 'auto-ai-blogger-<%= pkg.version %>.zip',
					mode: 'zip',
				},
				files: [
					{
						src: ['./auto-ai-blogger/**'],
					},
				],
			},
		},
		clean: {
			main: ['auto-ai-blogger'],
			zip: ['*.zip'],
			concat: ['assets/js/unminified/main.js', 'assets/css/unminified/main.css'],
		},
		bumpup: {
			options: {
				updateProps: {
					pkg: 'package.json'
				}
			},
			file: 'package.json'
		},
		replace: {
			plugin_main: {
				src: ['auto-ai-blogger.php'],
				overwrite: true,
				replacements: [
					{
						from: /Version: \bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-A-Z-]+(?:\.[\da-z-A-Z-]+)*)?(?:\+[\da-z-A-Z-]+(?:\.[\da-z-A-Z-]+)*)?\b/g,
						to: 'Version: <%= pkg.version %>'
					}
				]
			},
			plugin_readme: {
				src: ['readme.txt'],
				overwrite: true,
				replacements: [
					{
						from: /Stable tag: \bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-A-Z-]+(?:\.[\da-z-A-Z-]+)*)?(?:\+[\da-z-A-Z-]+(?:\.[\da-z-A-Z-]+)*)?\b/g,
						to: 'Stable tag: <%= pkg.version %>'
					}
				]
			},
			plugin_const: {
				src: ['auto-ai-blogger.php'],
				overwrite: true,
				replacements: [
					{
						from: /AUTOAIB_VERSION', '.*?'/g,
						to: 'AUTOAIB_VERSION\', \'<%= pkg.version %>\''
					}
				]
			},
			plugin_function_comment: {
				src: [
					'*.php',
					'**/*.php',
					'!node_modules/**',
					'!php-tests/**',
					'!bin/**',
					'!vendor/**',
					'!tests/**',
					'!artifact/**',
				],
				overwrite: true,
				replacements: [
					{
						from: 'x.x.x',
						to: '<%=pkg.version %>'
					}
				]
			}
        },
		wp_readme_to_markdown: {
			your_target: {
				files: {
					'README.md': 'readme.txt',
				},
			},
		},
		rtlcss: {
			options: {
				// RTL options
				config: {
					preserveComments: true,
					greedy: true
				},
				// generate source maps
				map: false
			},
			dist: {
				files: [
					{
						expand: true,
						cwd: 'assets/build',
						src: [
							'*.css',
							'!*-rtl.css',
						],
						dest: 'assets/build',
						ext: '-rtl.css'
					},
					{
						expand: true,
						cwd: 'assets/css/unminified/',
						src: [
							'*.css',
							'!*-rtl.css',
						],
						dest: 'assets/css/unminified',
						ext: '-rtl.css'
					},
				]
			}
		},
		postcss: {
			options: {
				map: false,
				processors: [
					flexibility,
					autoprefixer({
						browsers: [
							'> 1%',
							'ie >= 11',
							'last 1 Android versions',
							'last 1 ChromeAndroid versions',
							'last 2 Chrome versions',
							'last 2 Firefox versions',
							'last 2 Safari versions',
							'last 2 iOS versions',
							'last 2 Edge versions',
							'last 2 Opera versions'
						],
						cascade: false
					})
				]
			},
			style: {
				expand: true,
				src: [
					'assets/css/unminified/*.css'
				]
			}
		},
		uglify: {
			js: {
				files: [
					{ // all .js to min.js.
						expand: true,
						src: [
							'**.js',
						],
						dest: 'assets/js/minified',
						cwd: 'assets/js/unminified',
						ext: '.min.js'
					},
				]
			},
		},
		cssmin: {
			options: {
				keepSpecialComments: 0
			},
			css: {
				files: [
					// Generated '.min.css' files from '.css' files.
					// NOTE: Avoided '-rtl.css' files.
					{
						expand: true,
						src: [
							'**/*.css',
							'**/*-rtl.css',
						],
						dest: 'assets/css/minified',
						cwd: 'assets/css/unminified',
						ext: '.min.css'
					},
				],
			},
		},
		concat: {
			options: {
				separator: '\n'
			},
			dist: {
				files: []
			}
		},
	});

	/* Load Tasks */
	grunt.loadNpmTasks('grunt-rtlcss');
	grunt.loadNpmTasks('grunt-bumpup');
    grunt.loadNpmTasks('@lodder/grunt-postcss');
    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks("grunt-wp-readme-to-markdown");

	/* Generate Read MD file. */
	grunt.registerTask( 'readme', [ 'wp_readme_to_markdown' ] );

	/* Bump Version - `grunt version-bump --ver=<version-number>` */
    grunt.registerTask('version-bump', function (ver) {

        var newVersion = grunt.option('ver');

        if (newVersion) {
            newVersion = newVersion ? newVersion : 'patch';

            grunt.task.run('bumpup:' + newVersion);
            grunt.task.run('replace');
        }
    });

	/* Register rtl task */
    grunt.registerTask('rtl', ['rtlcss']);

	/* Register styler task */
	grunt.registerTask('style', ['postcss:style', 'rtl']);

	/* Register minification task */
    grunt.registerTask('minify', ['clean:concat', 'concat', 'style', 'uglify:js', 'cssmin:css']);

	/* Register task started */
	grunt.registerTask('release', [
		'clean:zip',
		'copy:main',
		'compress:main',
		'clean:main',
	]);
};
