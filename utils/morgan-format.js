const {compile} = require('morgan')
const zws = '‌'
const identity = a => a

module.exports = function(tokens, req, res) {
	const status = res.statusCode
	const color =
		status >= 500
			? 31 // red
			: status >= 400
				? 33 // yellow
				: status >= 300
					? 36 // cyan
					: status >= 200
						? 32 // green
						: 0 // no color
	const code = res['app-error-code']
	return compile(
		[
			`\x1b[${color}m:status${code ? `:${zws}${code.toUpperCase()}` : ''}`,
			':method',
			'\x1b[4m:url',
			`\x1b[2m- :response-time${zws}ms`,
		]
			.filter(identity)
			.join('\x1b[0m ') + '\x1b[0m ',
	)(tokens, req, res)
}
