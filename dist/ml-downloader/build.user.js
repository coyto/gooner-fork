// ==UserScript==
// @name         GoonerFork
// @namespace    http://github.com/coyto/
// @description  Adds a button to download videos directly
// @author       coyto
// @version      1.01
// @updateURL    https://github.com/coyto/gooner-fork/raw/main/dist/ml-downloader/build.user.js
// @downloadURL  https://github.com/coyto/gooner-fork/raw/main/dist/ml-downloader/build.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=motherless.com
// @license      WTFPL; http://www.wtfpl.net/txt/copying/
// @match        https://motherless.com/*
// @connect      self
// @connect      motherless.com
// @connect      cdn5-videos.motherlessmedia.com
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_log
// @grant        GM_openInTab
// ==/UserScript==
;(function () {
  'use strict'

  document.addEventListener('DOMContentLoaded', async () => {
    // debugger;
  })

  function injectButton() {
    const container = document.querySelector('#ad-ntva-1')
    if (!container || container.querySelector('.tm-download-btn')) return

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'tm-download-btn'
    btn.textContent = 'Download Video'

    Object.assign(btn.style, {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      margin: '5px',
      padding: '10px 16px',
      borderRadius: '4px',
      willChange: 'opacity',
      color: '#fff',
      backgroundColor: '#424557',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'background 0.2s,color 0.2s',
      boxShadow: '0 1px 4px -2px black,inset 0 2px 1px -1px rgba(255,255,255,0.1)',
      cursor: 'pointer',
    })

    btn.addEventListener('click', () => {
      console.log('[TM] button clicked')

      // Search script tag text content directly to avoid outerHTML entity mangling
      let rawUrl = null
      const urlPattern = /https:\/\/cdn5-videos\.motherlessmedia\.com\/videos\/[^\s"'<]+/

      for (const script of document.querySelectorAll('script')) {
        const m = script.textContent.match(urlPattern)
        if (m) {
          rawUrl = m[0]
          break
        }
      }

      // Fallback: check video/source elements
      if (!rawUrl) {
        const src = document.querySelector('video source, video[src]')
        if (src) rawUrl = src.src || src.getAttribute('src')
      }

      if (!rawUrl) {
        return
      }

      const fullUrl = rawUrl.replace(/&amp;/g, '&')

      const urlObj = new URL(fullUrl)
      const fileName = urlObj.pathname.split('/').pop()

      console.log('[TM] rawUrl:', rawUrl)
      console.log('[TM] fullUrl:', fullUrl)
      console.log('[TM] fullUrl length:', fullUrl.length)
      console.log('[TM] hash param:', urlObj.searchParams.get('hash'))

      GM_download({
        url: fullUrl,
        name: `abc/${fileName}`,
        saveAs: false,
        onerror: (err) => console.error('[TM] download failed:', err),
        onload: () => console.log('[TM] download complete'),
      })
    })
    container.appendChild(btn)
  }

  document.querySelectorAll('.awn-ignore').forEach((el) => {
    if (el.textContent.includes('happy to be back and truly appreciate everyone who has been waiting!')) {
      el.remove()
    }
  })

  document.querySelectorAll('#contentGallery').forEach((gallery) => {
    gallery.style.display = 'none'
  })

  const timer = setInterval(() => {
    const container = document.querySelector('.view-right.text-right > div')
    if (container) {
      clearInterval(timer)
      injectButton()
    }
  }, 500)
})()
