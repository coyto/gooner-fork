---
name: new-userscript
description: Scaffold a new userscript in src/ following GoonerFork conventions — metadata block, GM_ API grants, match patterns, and file structure.
disable-model-invocation: true
---

The user wants to add a new userscript to this project. They will provide a name and target site via $ARGUMENTS.

## Steps

1. **Ask for required details** (if not already in $ARGUMENTS):
   - Script name and purpose (one sentence)
   - Target URL pattern (e.g., `https://example.com/*`)
   - Whether it needs `GM_download`, `GM_xmlhttpRequest`, or other GM_ APIs

2. **Create `src/<kebab-name>.js`** with this structure:

```js
// ==UserScript==
// @name         <Script Name>
// @namespace    https://github.com/coyto/gooner-fork
// @version      <YYYY-MM-DD>
// @description  <one-line description>
// @author       GoonerFork
// @match        <url-pattern>
// @grant        GM_download
// @grant        unsafeWindow
// ==/UserScript==

;(function () {
  'use strict'

  // implementation
})()
```

   - Only include `@grant` lines for GM_ APIs actually used
   - Use `@match` patterns matching the target site
   - Version format is `YYYY-MM-DD`
   - Wrap everything in an IIFE with `'use strict'`

3. **Follow existing style**: single quotes, no semicolons, 2-space indent (per Prettier config)

4. **Remind the user** to add the new script to `build.js` (once it exists) and to test by loading it in Tampermonkey/Violentmonkey on the target site.
