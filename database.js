const fs = require('fs')
const {join} = require('path')
const request = require('got')
const {router: createRouter, create} = require('json-server')
const {EventEmitter} = require('events')
const database = join(__dirname, 'db.json')
const sock = '/tmp/database.sock'
const methods = ['get', 'post', 'put', 'delete', 'patch']
const router = createRouter(database)

const enhance = app =>
	app
		.use((req, res, next) => {
			if (req.method === 'POST') {
				req.body.id = require('uuid/v4')()
				req.body.createdAt = Date.now()
			}
			next()
		})
		.use('/db', function(req, res, next) {
			const e = new Error('Forbidden')
			e.code = 'db_access'
			e.status = 403
			next(e)
		})
		.use(router)

fs.unlink(sock, err => {
	if (err && err.code !== 'ENOENT') throw err
	const server = enhance(create()).listen(sock, err => {
		if (err) throw err
		console.log(`local database: unix:${sock}`)
		module.exports.server.emit('ready', server)
	})
})

module.exports = enhance
module.exports.server = new EventEmitter()
module.exports.db = methods.reduce((object, method) => {
	object[method] = async (_path, options) => {
		const path = `/${_path}`.replace(/^\/\//, '/')
		const url = new URL(path, 'http://localhost')
		const query = url.searchParams.toString()
		const res = await request.get(`unix:${sock}:${url.pathname}`, {
			...options,
			query,
			json: true,
		})
		return res.body
	}
	// object[method] = (path, options) => request.get(
	//   `unix:${sock}:${path}`, {...options, json: true},
	// ).then(req => req.body)
	return object
}, {})
