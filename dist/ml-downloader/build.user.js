// ==UserScript==
// @name         MotherlessDownloadButton
// @namespace    http://github.com/coyto/
// @version      1.0.1
// @description  Adds a button to download videos directly
// @author       coyto
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

(function () {
  'use strict';

  function injectButton() {
    const container = document.querySelector('#ad-ntva-1');
    if (!container || container.querySelector('.tm-download-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tm-download-btn';
    btn.textContent = 'Download Video';

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
    });

    btn.addEventListener('click', () => {
      // Search script tag text content directly to avoid outerHTML entity mangling
      let rawUrl = null;
      const urlPattern = /https:\/\/cdn5-videos\.motherlessmedia\.com\/videos\/[^\s"'<]+/;

      for (const script of document.querySelectorAll('script')) {
        const m = script.textContent.match(urlPattern);
        if (m) {
          rawUrl = m[0];
          break;
        }
      }

      // Fallback: check video/source elements
      if (!rawUrl) {
        const src = document.querySelector('video source, video[src]');
        if (src) rawUrl = src.src || src.getAttribute('src');
      }

      if (!rawUrl) {
        console.error('[TM] No video URL found');
        return;
      }

      const fullUrl = rawUrl.replace(/&amp;/g, '&');

      const urlObj = new URL(fullUrl);
      const fileName = urlObj.pathname.split('/').pop();

      GM_download({
        url: fullUrl,
        name: `abc/${fileName}`,
        saveAs: false,
        onerror: (err) => console.error('[TM] download failed:', err),
        onload: () => console.log('[TM] download complete'),
      });
    });
    container.appendChild(btn);

    const xpathResult = document.evaluate(
      "//div[contains(text(), 'strengthened our moderation')]",
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    for (let i = 0; i < xpathResult.snapshotLength; i++) {
      const div = xpathResult.snapshotItem(i);
      div.style.display = 'none';
    }
  }

  // document.querySelectorAll('.awn-ignore').forEach((el) => el.remove())

  const timer = setInterval(() => {
    const container = document.querySelector('#ad-ntva-1');
    if (container) {
      clearInterval(timer);
      injectButton();
    }
  }, 500);
})();
