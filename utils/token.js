const branca = require('branca')
const {
	errors: {auth_missing, auth_wrong},
} = require('../constants')

const exceptions = {
	extract: new Error('Token extraction exception'),
	verify: new Error('Token verification exception'),
}

class TokenGenerator {
	constructor(key) {
		const instance = branca(key)
		this.encode = (...params) => instance.encode(...params).toString()
		this.decode = (...params) => instance.decode(...params).toString()
	}
	cast(domain) {
		return `user@${domain}`
	}
	create(domain, user_id) {
		const {cast, encode} = this
		if (!user_id || typeof user_id !== 'string')
			throw new Error('Missing user_id key')
		if (!domain || typeof domain !== 'string')
			throw new Error('Missing domain key')
		try {
			return encode(JSON.stringify({user_id, domain: cast(domain)}))
		} catch (e) {
			throw new Error(e)
		}
	}
	extract(token, domain, ttl) {
		if (!token || typeof token !== 'string')
			throw new Error('Missing token key')
		if (!domain || typeof domain !== 'string')
			throw new Error('Missing domain key')
		const {cast, decode} = this
		try {
			const value = JSON.parse(decode(token, ttl))
			if (value.domain !== cast(domain)) throw exceptions.extract
			return value
		} catch (e) {
			throw exceptions.extract
		}
	}
	verify(token, domain, user_id, ttl) {
		if (!user_id || typeof user_id !== 'string')
			throw new Error('Missing user_id key')
		try {
			return this.extract(token, domain, ttl).user_id === user_id
		} catch (err) {
			if (err === exceptions.extract) return false
			throw exceptions.verify
		}
	}
}

module.exports = ((key, ttl) => {
	if (!key) throw new Error('ENV: missing token_secret')
	const singleton = new TokenGenerator(key)
	return {
		create: singleton.create.bind(singleton),
		verify: singleton.verify.bind(singleton),
		middleware: (option = 'user_id') => (req, res, next) => {
			const param = typeof option === 'string' && option
			const extract = option === true

			const auth = req.get('authorization')
			if (!auth) return next(auth_missing)
			const [scheme, token] = auth.split(' ')
			if (scheme !== 'Bearer' || !token) return next(auth_missing)

			if (
				param &&
				req.params[param] &&
				!singleton.verify(token, req.get('host'), req.params[param], ttl)
			)
				return next(auth_wrong)

			if (extract) {
				const {user_id} = singleton.extract(token, req.get('host'), ttl)
				if (!user_id) return next(auth_wrong)
				req.user_id = user_id
				return next()
			}

			return next()
		},
	}
})(require('../constants').token_secret)
