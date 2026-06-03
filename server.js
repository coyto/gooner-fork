const express = require('express')
const path = require('path')

const app = express()
const PORT = 8124

const SCRIPTS = [
  '/dist/ml-downloader/build.user.js',
  '/dist/coomer-video-viewer/build.user.js',
  '/dist/forum-post-downloader/build.user.js',
]

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.use('/dist', express.static(path.join(__dirname, 'dist')))

app.get('/', (req, res) => {
  const items = SCRIPTS.map(
    (s) => `<li><a href="http://localhost:${PORT}${s}">http://localhost:${PORT}${s}</a></li>`
  ).join('')
  res.send(
    `<!DOCTYPE html><html><body><h1>GoonerFork Dev Server</h1><ul>${items}</ul><p>Point Tampermonkey at these URLs to auto-reload on rebuild.</p></body></html>`
  )
})

app.listen(PORT, () => {
  console.log(`Dev server → http://localhost:${PORT}`)
  SCRIPTS.forEach((s) => console.log(`  http://localhost:${PORT}${s}`))
})
