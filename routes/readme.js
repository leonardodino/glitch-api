const fs = require('fs')
const marked = require('marked')

const text = fs.readFileSync('README.md').toString('utf8')
const css = fs.readFileSync('./main.css').toString('utf8')
const html = `
  <html>
    <head>
      <title>MOCK API</title>
      <style>${`\n${css}`.replace(/(.+)/g, '        $1')}
      </style>
    </head>
    <body>${marked(text)}</body>
  </html>
`

module.exports = [
	[
		'get',
		'/README.md',
		(req, res) =>
			res.status(200).structured({
				html,
				text,
				markdown: text,
				json: {html, text},
			}),
	],
]
