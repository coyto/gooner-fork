// ==UserScript==
// @name         GoonerFork
// @namespace    http://github.com/coyto/
// @description  Adds a button to download videos directly
// @author       coyto
// @version      1.00
// @updateURL    https://github.com/coyto/gooner-fork/raw/main/dist/build.user.js
// @downloadURL  https://github.com/coyto/gooner-fork/raw/main/dist/build.user.js
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
const tippy = window.tippy
const styles = {
  tippy: {
    theme: `.tippy-box[data-theme~=transparent]{background-color:transparent}.tippy-box[data-theme~=transparent]>.tippy-arrow{width:14px;height:14px}.tippy-box[data-theme~=transparent][data-placement^=top]>.tippy-arrow:before{border-width:7px 7px 0;border-top-color:#3f3f3f}.tippy-box[data-theme~=transparent][data-placement^=bottom]>.tippy-arrow:before{border-width:1 7px 7px;border-bottom-color:#3f3f3f}.tippy-box[data-theme~=transparent][data-placement^=left]>.tippy-arrow:before{border-width:7px 0 7px 7px;border-left-color:#3f3f3f}.tippy-box[data-theme~=transparent][data-placement^=right]>.tippy-arrow:before{border-width:7px 7px 7px 0;border-right-color:#3f3f3f}.tippy-box[data-theme~=transparent]>.tippy-backdrop{background-color:transparent;}.tippy-box[data-theme~=transparent]>.tippy-svg-arrow{fill:gainsboro}`,
  },
}
const ui = {
  /**
   * @returns {string}
   */
  getTooltipBackgroundColor: () => {
    const scheme = document.documentElement.dataset.colorScheme
    return scheme === 'dark' ? '#2B2B2B' : '#EDF0F3'
  },

  /**
   * @param target
   * @param content
   * @param options
   * @returns {*}
   */
  tooltip: (target, content, options = {}) => {
    // noinspection JSUnusedGlobalSymbols
    return tippy(target, {
      arrow: true,
      theme: 'transparent',
      allowHTML: true,
      content: content,
      appendTo: () => document.body,
      placement: 'left',
      interactive: true,
      ...options,
    })
  },
}
const init = {
  injectCustomStyles: () => {
    // Tippy transparent theme.
    const styleEl = document.createElement('style')
    styleEl.textContent = styles.tippy.theme
    document.head.append(styleEl)

    const customStyles = document.createElement('style')
    // Margins classes
    const marginClasses = []

    for (let i = 1; i <= 15; i++) {
      marginClasses.push(`.m-l-${i} {margin-left: ${i}px;}`)
      marginClasses.push(`.m-t-${i} {margin-top: ${i}px;}`)
    }

    customStyles.textContent = marginClasses.join('\n')
    document.head.append(customStyles)
  },
}

;(function () {
  'use strict'

  document.addEventListener('DOMContentLoaded', async () => {
    // debugger;
    // init.injectCustomStyles();
    // const color = ui.getTooltipBackgroundColor();
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
        console.error('[TM] No video URL found')
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

  const timer = setInterval(() => {
    const container = document.querySelector('.view-right.text-right > div')
    if (container) {
      clearInterval(timer)
      injectButton()
    }
  }, 500)
})()
