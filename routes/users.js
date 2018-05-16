const {hash} = require('argon2')
const wrap = require('express-async-handler')
const {
	errors: {parameter_missing, email_taken},
} = require('../constants')
const {db} = require('../database')
const {middleware: requiresToken} = require('../utils/token')

const isValid = ({email, password} = {}) =>
	typeof email === 'string' &&
	email.length &&
	typeof password === 'string' &&
	password.length

const isEmailRegistered = async email =>
	!!(await db.get(`users?email=${email}`)).length

module.exports = [
	[
		'post',
		'/users',
		wrap(async (req, res, next) => {
			if (!isValid(req.body)) throw parameter_missing
			if (await isEmailRegistered(req.body.email)) throw email_taken
			const {password, email} = req.body
			req.body.email = email.toLowerCase()
			req.body.password = undefined
			req.body.hash = await hash(password)
			next()
		}),
	],
	['all', '/users/:user_id', requiresToken('user_id')],
	[
		'all',
		'/profile',
		requiresToken(true),
		(req, res, next) => {
			req.url = `/users/${req.user_id}`
			return next()
		},
	],
]
