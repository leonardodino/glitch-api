const express = require('express')
const app = require('./app').reduce((app, fn) => fn(app), express())

const getRootAddress = server => {
	const {address, port, protocol} = server.address()
	const isLocalhost = address === '::'
	if (protocol === 'isIPv6' && !isLocalhost) {
		throw new Error('doesnt handles direct ipv6 routing')
	}
	const hostname = isLocalhost ? 'localhost' : address
	return `http://${hostname}:${port}`
}

if (require.main === module) {
	const server = app.listen(process.env.PORT, () => {
		app.set('root', getRootAddress(server))
		console.log(
			process.env.PROJECT_DOMAIN
				? `app is running: https://${process.env.PROJECT_DOMAIN}.glitch.me/`
				: `app is running: ${app.get('root')}/`,
		)
	})
}
