const {verify} = require('argon2')
const wrap = require('express-async-handler')
const {
	errors: {auth_missing, auth_wrong},
} = require('../constants')
const {db} = require('../database')
const {verify: verifyToken, create: createToken} = require('../utils/token')

const handleError = (req, res, next) => err => {
	if (!err) return next(new Error('Unknown Error'))
	if (err.status === 401) res.set('WWW-Authenticate', 'Basic')
	return next(err)
}

const isValid = ({email, password} = {}) =>
	typeof email === 'string' &&
	email.length &&
	typeof password === 'string' &&
	password.length

const credentials = (req, res, next) => {
	const error = handleError(req, res, next)
	const auth = require('basic-auth')(req)
	const {email, password} = req.body || {}
	const user = auth
		? {email: auth.name, password: auth.pass}
		: {email, password}

	if (!isValid(user)) return error(auth_missing)

	req.credentials = user
	return next()
}

const login = wrap(async (req, res, next) => {
	const error = handleError(req, res, next)
	const {email, password} = req.credentials
	const [{hash, id} = {}] = await db.get(`users?email=${email}`)
	if (!hash) return error(auth_wrong)
	if (!(await verify(hash, password))) return error(auth_wrong)
	req.user_id = id
	return next()
})

module.exports = [
	[
		'get',
		'/token',
		credentials,
		login,
		(req, res, next) => {
			try {
				const {user_id: id} = req
				const token = createToken(req.get('host'), id)
				const status = +(req.get('X-Request-Success-Status') || 200)
				return res.status(status).structured({
					json: {token, id, scheme: 'Bearer'},
					text: `${id}\n${token}`,
					html: `<pre>${id}\n${token}</pre>`,
				})
			} catch (e) {
				next(e)
			}
		},
	],
]
