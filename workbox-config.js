module.exports = {
	globDirectory: 'build/',
	globPatterns: [
		'**/*.{json,png,svg,ico,html,txt,css,js}'
	],
	swDest: 'build/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};