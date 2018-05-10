const compose = (..._fns) => {
	const fns = Array.isArray(_fns[0]) ? _fns[0] : _fns
	return fns.reduce((f, g) => (...args) => f(g(...args)))
}

const flow = (..._fns) => {
	const fns = Array.isArray(_fns[0]) ? _fns[0] : _fns
	return compose(fns.reverse())
}

const mapKeys = (a, b) => {
	if (!b) return b => mapKeys(a, b)
	const fn = typeof a === 'function' ? a : b
	const object = typeof a === 'function' ? b : a
	const keys = Object.keys(object)
	return keys.reduce((result, key) => {
		result[key] = fn(object[key], key)
		return result
	}, {})
}

module.exports = {
	mapKeys,
	flow,
	compose,
}
