// ==UserScript==
// @name         Coomer Video Viewer
// @namespace    https://github.com/xdegeneratex
// @version      2025-06-30
// @description  View Coomer video in the browser.
// @author       https://github.com/xdegeneratex
// @match        https://coomer.st/*/user/*/post/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=coomer.st
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  console.log("[Coomer Video Viewer]: Script loaded");

  function addPlayButtons() {
    const links = document.querySelectorAll(".post__attachment-link");

    if (links.length === 0) {
      return false;
    }

    let addedAny = false;

    links.forEach((link) => {
      // Skip if we already added a button for this link
      if (link.dataset.playButtonAdded) {
        return;
      }

      const linkText = link.textContent;

      if (!linkText) {
        return;
      }

      const ext = linkText.split(".").pop();

      if (!/^(mp4|m4v|mov|mpeg|wmv|webm|mkv)$/i.test(ext)) {
        return;
      }

      const viewInBrowserLink = link.cloneNode(true);
      viewInBrowserLink.target = "_blank";
      viewInBrowserLink.href = link.href.replace(/\?.*/, "");
      viewInBrowserLink.textContent = "▶ Play In Browser";
      viewInBrowserLink.style.marginLeft = "10px";
      link.insertAdjacentElement("afterend", viewInBrowserLink);

      viewInBrowserLink.addEventListener("click", (e) => {
        e.preventDefault();
        const videoUrl = viewInBrowserLink.href;
        const videoWindow = window.open("", "_blank");
        videoWindow.document.write(`
          <html><head><title>Video Player</title></head>
          <body style="margin:0; background-color: #000;">
            <video src="${videoUrl}" controls autoplay style="width:100vw; height:100vh;"></video>
          </body></html>
        `);
        videoWindow.document.close();
      });

      // Mark this link as processed
      link.dataset.playButtonAdded = "true";
      addedAny = true;
    });

    if (addedAny) {
      console.log("[Coomer Video Viewer]: Play buttons added successfully");
    }

    return addedAny;
  }

  // Keep the observer running permanently to handle SPA navigation
  const observer = new MutationObserver((mutations) => {
    // Check if we're on a post page by looking at the URL
    if (!/\/post\//.test(window.location.pathname)) {
      return;
    }

    // Try to add buttons whenever DOM changes
    addPlayButtons();
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also try immediately in case content is already loaded
  addPlayButtons();

  console.log(
    "[Coomer Video Viewer]: Observer started, watching for content...",
  );
})();
