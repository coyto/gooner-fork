// ==UserScript==
// @name         MetaDollDownloader
// @namespace    http://github.com/coyto/
// @version      1.0.0
// @description  Adds a button to download videos directly on MetaDoll
// @author       coyto
// @updateURL    https://github.com/coyto/gooner-fork/raw/main/dist/metadoll-downloader/build.user.js
// @downloadURL  https://github.com/coyto/gooner-fork/raw/main/dist/metadoll-downloader/build.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=metadoll.to
// @license      WTFPL; http://www.wtfpl.net/txt/copying/
// @match        https://metadoll.to/*
// @connect      self
// @connect      metadoll.to
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
    const container = document.querySelector('#tab_video_info');
    if (!container || container.querySelector('#md-download-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'md-download-btn';
    btn.className = 'video-tags';
    btn.textContent = 'Download Video';

    btn.addEventListener('click', () => {
      const links = [...document.querySelectorAll('#tab_video_download a.video-categories')];

      if (!links.length) {
        console.error('[MD] No download links found');
        return;
      }

      // Parse quality from link text ("1080p, 45 Mb" → 1080), sort descending
      const best = links
        .map((a) => {
          const match = a.textContent.trim().match(/^(\d+)p/);
          return { quality: match ? parseInt(match[1], 10) : 0, el: a };
        })
        .sort((a, b) => b.quality - a.quality)[0];

      // a.href is fully resolved and entity-decoded; a.getAttribute('href') is raw with &amp;
      let downloadUrl = best.el.href;

      // Attach session cookie to URL if the link requires it
      const sessionName = best.el.dataset.attachSession;
      if (sessionName) {
        const cookieMatch = document.cookie.match(new RegExp(`(?:^|;\\s*)${sessionName}=([^;]+)`));
        if (cookieMatch) {
          const url = new URL(downloadUrl);
          url.searchParams.set(sessionName, cookieMatch[1]);
          downloadUrl = url.toString();
        }
      }

      const urlObj = new URL(downloadUrl);
      const fileName = urlObj.searchParams.get('download_filename') || urlObj.pathname.split('/').pop();

      GM_download({
        url: downloadUrl,
        name: fileName,
        saveAs: false,
        onerror: (err) => console.error('[MD] download failed:', err),
        onload: () => console.log('[MD] download complete'),
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

  const timer = setInterval(() => {
    const container = document.querySelector('#ad-ntva-1');
    if (container) {
      clearInterval(timer);
      injectButton();
    }
  }, 500);
})();
