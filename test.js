const {server: database} = require('./database')

const server = require('.').listen(err => {
	if (err) throw err
	server.close()
	database.on('ready', server => server.close())
})
