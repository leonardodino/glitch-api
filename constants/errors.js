const toError = (a = 'Unknown', code = null) => {
	const [status, message] = Array.isArray(a) ? a : [400, a]
	return Object.assign(new Error(message), {status, code, app: !!code})
}

module.exports = require('../utils').mapKeys(toError, {
	auth_missing: [401, 'Authentication Required'],
	auth_wrong: [401, 'Wrong Username and/or Password'],
	email_taken: [400, 'User Already Registered'],
	parameter_missing: [400, 'Missing Required Parameters'],
	not_found: [404, 'Resource Does Not Exists'],
})
