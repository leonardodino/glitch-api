const fs = require('fs')
const marked = require('marked')

const text = fs.readFileSync('README.md').toString('utf8')
const css = fs.readFileSync('./main.css').toString('utf8')
const [{text: title}] = marked.lexer(text)
const html = `
  <html>
    <head>
      <title>${title}</title>
      <style>${`\n${css}`.replace(/(.+)/g, '        $1')}
      </style>
    </head>
    <body><div id="container">${marked(text)}</div></body>
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
