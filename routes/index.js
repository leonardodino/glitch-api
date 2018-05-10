const endpoints = require('fs')
	.readdirSync(__dirname)
	.filter(a => a !== 'index.js')

module.exports = app =>
	endpoints
		.reduce((app, endpoint) => {
			return require(`./${endpoint}`).reduce(
				(app, [method, url, ...handlers]) => app[method](url, handlers),
				app,
			)
		}, app)
		.get('/', require('./readme')[0].slice(2))
