const isPlainObject = o => typeof o === 'object' && o.constructor === Object
const isJSON = res =>
	require('mime').getExtension(res.get('content-type')) === 'json'
const mung = fn => (req, res, next) => {
	const {send} = res
	res.send = (data, ...other) => {
		if (!isJSON(res)) return send.apply(res, [data, ...other])
		const json = typeof data === 'string' ? JSON.parse(data) : data
		const result = JSON.stringify(fn(json), null, 2)
		return send.apply(res, [result, ...other])
	}
	next()
}

const blacklist = ['hash']
const blackhole = blacklist.reduce((object, key) => {
	object[key] = undefined
	return object
}, {})

const cleanup = value =>
	isPlainObject(value)
		? {...value, ...blackhole}
		: (console.log(typeof value, value), value)

const tooling = app =>
	app.use(function(req, res, next) {
		res.structured = formats =>
			res.format({
				...require('./utils').mapKeys(formats, value => () => res.send(value)),
				html: () => {
					res.send(
						formats.html
							? formats.html
							: '<pre>' + JSON.stringify(formats.json, null, 2) + '</pre>',
					)
				},
				default: () => {
					res.send(formats.json)
				},
			})
		next()
	})

const logging = app =>
	app.use(require('morgan')(require('./utils/morgan-format.js')))

const protocol = app =>
	app
		.set('trust proxy', true)
		.set('json spaces', 2)
		.use(require('cors')())
		.use(require('helmet')({hsts: {preload: true}}))
		.use(require('helmet').referrerPolicy())
		.use(require('helmet').noCache())
		.use(
			(req, res, next) =>
				req.secure
					? next()
					: res.redirect(301, `https://${req.get('host')}${req.originalUrl}`),
		)
		.use(require('express').json({strict: true, extended: false}))
		.use(require('express').urlencoded({extended: false}))
		.use(
			mung(data => (Array.isArray(data) ? data.map(cleanup) : cleanup(data))),
		)

const patches = app =>
	app
		.use(
			mung(data => (Array.isArray(data) ? data.map(cleanup) : cleanup(data))),
		)
		.use((req, res, next) => {
			if (req.url !== '/users') return next()
			if (req.method !== 'POST') return next()
			const {send} = res
			const {email, password} = req.body
			res.send = async (...args) => {
				if (res.statusCode !== 201) {
					console.log('not ok')
					return send.apply(res, args)
				}

				res.send = send.bind(res)
				require('http-proxy')
					.createProxyServer()
					.web(req, res, {
						method: 'GET',
						target: `${app.get('root')}/token`,
						ignorePath: true,
						auth: `${email}:${password}`,
						headers: {'Content-Length': '0'},
					})
			}
			next()
		})

const errors = app =>
	app
		.use(require('serve-favicon')(`${__dirname}/favicon.ico`))
		.use(function(err, req, res, next) {
			const {message = '', status = 400, code = null} = err
			if (err.app) {
				res['app-error-code'] = code
			} else {
				console.error(err)
			}
			res.status(status).structured({
				json: {error: {message, code}},
				text: `Error: ${message}`,
			})
		})

module.exports = [
	tooling,
	logging,
	protocol,
	patches,
	require('./routes'),
	require('./database'),
	errors,
]
