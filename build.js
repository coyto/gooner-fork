const { readFileSync, writeFileSync, mkdirSync } = require('fs')
const { dirname } = require('path')
const { spawnSync } = require('child_process')

const REPO_RAW = 'https://github.com/coyto/gooner-fork/raw/main'

const scripts = [
  { src: 'src/motherless-downloader.js', dist: 'dist/ml-downloader/build.user.js' },
  { src: 'src/coomer-video-viewer.js', dist: 'dist/coomer-video-viewer/build.user.js' },
  { src: 'src/forum-post-downloader.js', dist: 'dist/forum-post-downloader/build.user.js' },
]

for (const { src, dist } of scripts) {
  let content = readFileSync(src, 'utf8')
  const url = `${REPO_RAW}/${dist}`

  if (content.includes('@updateURL')) {
    content = content.replace(/\/\/ @updateURL\s+.+/, `// @updateURL    ${url}`)
    content = content.replace(/\/\/ @downloadURL\s+.+/, `// @downloadURL  ${url}`)
  } else {
    content = content.replace(/(\/\/ @version\s+.+)/, `$1\n// @updateURL    ${url}\n// @downloadURL  ${url}`)
  }

  mkdirSync(dirname(dist), { recursive: true })
  writeFileSync(dist, content, 'utf8')
  console.log(`Built: ${src} → ${dist}`)
}

spawnSync('pnpm', ['exec', 'prettier', '--write', 'dist/', '--ignore-unknown'], { stdio: 'inherit', shell: false })
