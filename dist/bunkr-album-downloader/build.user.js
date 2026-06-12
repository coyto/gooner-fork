// ==UserScript==
// @name         BunkrAlbumDownloader
// @namespace    https://github.com/coyto
// @description  Adds a "Download All" button to Bunkr album/library pages; downloads every file into a subfolder named after the album tag
// @author       coyto
// @updateURL    https://github.com/coyto/gooner-fork/raw/main/dist/bunkr-album-downloader/build.user.js
// @downloadURL  https://github.com/coyto/gooner-fork/raw/main/dist/bunkr-album-downloader/build.user.js
// @version      1.0.0
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bunkr.fi
// @license      WTFPL; http://www.wtfpl.net/txt/copying/
// @match        https://bunkr.ac/a/*
// @match        https://bunkr.ax/a/*
// @match        https://bunkr.black/a/*
// @match        https://bunkr.cat/a/*
// @match        https://bunkr.ci/a/*
// @match        https://bunkr.cr/a/*
// @match        https://bunkr.fi/a/*
// @match        https://bunkr.is/a/*
// @match        https://bunkr.media/a/*
// @match        https://bunkr.nu/a/*
// @match        https://bunkr.ph/a/*
// @match        https://bunkr.pk/a/*
// @match        https://bunkr.ps/a/*
// @match        https://bunkr.red/a/*
// @match        https://bunkr.ru/a/*
// @match        https://bunkr.se/a/*
// @match        https://bunkr.si/a/*
// @match        https://bunkr.site/a/*
// @match        https://bunkr.sk/a/*
// @match        https://bunkr.ws/a/*
// @match        https://bunkrr.ru/a/*
// @match        https://bunkrr.su/a/*
// @match        https://bunkrrr.org/a/*
// @connect      bunkr.ac
// @connect      bunkr.ax
// @connect      bunkr.black
// @connect      bunkr.cat
// @connect      bunkr.ci
// @connect      bunkr.cr
// @connect      bunkr.fi
// @connect      bunkr.is
// @connect      bunkr.media
// @connect      bunkr.nu
// @connect      bunkr.ph
// @connect      bunkr.pk
// @connect      bunkr.ps
// @connect      bunkr.red
// @connect      bunkr.ru
// @connect      bunkr.se
// @connect      bunkr.si
// @connect      bunkr.site
// @connect      bunkr.sk
// @connect      bunkr.ws
// @connect      bunkrr.ru
// @connect      bunkrr.su
// @connect      bunkrrr.org
// @connect      b-cdn.net
// @connect      bunkr-cache.se
// @connect      gigachad-cdn.ru
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_openInTab
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ── Utilities ────────────────────────────────────────────────────────────

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const sanitizeFilename = (s) =>
    String(s || '')
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

  const asyncPool = async (limit, items, worker) => {
    const results = new Array(items.length);
    let i = 0;
    const runners = Array.from({ length: Math.max(1, limit) }, async () => {
      while (true) {
        const idx = i++;
        if (idx >= items.length) break;
        try {
          results[idx] = await worker(items[idx], idx);
        } catch (e) {
          results[idx] = null;
        }
      }
    });
    await Promise.all(runners);
    return results;
  };

  // ── Cloudflare challenge detection ────────────────────────────────────────

  function looksLikeCfChallenge(source, dom) {
    try {
      const head = String(source || '')
        .slice(0, 8000)
        .toLowerCase();
      const title = String(dom?.querySelector?.('title')?.textContent || '').trim();
      if (/just a moment|attention required|checking your browser/i.test(title)) return true;
      if (/cloudflare/i.test(title)) return true;
      if (head.includes('cdn-cgi/challenge-platform')) return true;
      if (head.includes('challenges.cloudflare.com')) return true;
      if (head.includes('cf-browser-verification')) return true;
      if (head.includes('checking your browser')) return true;
      if (head.includes('just a moment')) return true;
      if (head.includes('attention required')) return true;
      if (dom?.querySelector?.('#cf-challenge-running, #challenge-form, .cf-browser-verification, .cf-challenge'))
        return true;
    } catch (e) {}
    return false;
  }

  function looksLikeCfFilenameHint(name) {
    const n = String(name || '').trim();
    return (
      /^(?:just a moment\.{0,3}|checking your browser\.{0,3}|attention required\.{0,3})$/i.test(n) ||
      /cloudflare/i.test(n)
    );
  }

  // ── Domain blacklist ──────────────────────────────────────────────────────

  const CF_WARMUP_MS = 6000;
  const CF_MAX_RETRIES = 3;
  const CF_WARMUP_ACTIVE_TAB = false;
  const CF_WARMUP_COOLDOWN_MS = 15000;
  const FASTFAIL_ON_403 = true;
  const DOMAIN_BLACKLIST_MS = 60 * 60 * 1000;

  const domainBanUntil = new Map();

  function normalizeBase(v) {
    try {
      return new URL(String(v || '')).origin;
    } catch (e) {
      return String(v || '').replace(/\/+$/, '');
    }
  }

  function isBaseBanned(v) {
    try {
      const base = normalizeBase(v);
      const until = domainBanUntil.get(base);
      if (!until) return false;
      if (Date.now() >= until) {
        domainBanUntil.delete(base);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function banBase(v) {
    try {
      const base = normalizeBase(v);
      if (base === 'https://bunkr.cr') return;
      domainBanUntil.set(base, Date.now() + DOMAIN_BLACKLIST_MS);
    } catch (e) {}
  }

  function filterBases(bases) {
    const uniq = [];
    const seen = new Set();
    for (const b of bases || []) {
      const base = normalizeBase(b);
      if (!base || seen.has(base)) continue;
      seen.add(base);
      uniq.push(base);
    }
    const filtered = uniq.filter((b) => b === 'https://bunkr.cr' || !isBaseBanned(b));
    return filtered.length ? filtered : uniq;
  }

  // ── CF warmup tab ─────────────────────────────────────────────────────────

  let cfWarmupPromise = null;
  let cfWarmupLastAt = 0;

  async function cfWarmup(url) {
    try {
      const now = Date.now();
      if (cfWarmupPromise) return await cfWarmupPromise;
      if (now - cfWarmupLastAt < CF_WARMUP_COOLDOWN_MS) {
        await sleep(Math.min(1000, CF_WARMUP_MS));
        return null;
      }
      cfWarmupLastAt = now;
      cfWarmupPromise = (async () => {
        try {
          const tab = GM_openInTab(url, { active: CF_WARMUP_ACTIVE_TAB, insert: true, setParent: true });
          await sleep(CF_WARMUP_MS);
          try {
            tab?.close?.();
          } catch (e) {}
        } catch (e) {
          await sleep(CF_WARMUP_MS);
        }
      })();
      try {
        return await cfWarmupPromise;
      } finally {
        cfWarmupPromise = null;
      }
    } catch (e) {
      return null;
    }
  }

  // ── GM HTTP wrappers ──────────────────────────────────────────────────────

  const gmGet = (url) =>
    new Promise((resolve) => {
      try {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          responseType: 'text',
          headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
          onload: (r) => {
            const source = String(r.responseText || r.response || '');
            let dom = null;
            try {
              dom = new DOMParser().parseFromString(source, 'text/html');
            } catch (e) {}
            resolve({ dom, source, status: r.status || 0 });
          },
          onerror: () => resolve({ dom: null, source: '', status: 0 }),
          ontimeout: () => resolve({ dom: null, source: '', status: 0 }),
        });
      } catch (e) {
        resolve({ dom: null, source: '', status: 0 });
      }
    });

  const gmPost = (url, body, headers) =>
    new Promise((resolve) => {
      try {
        GM_xmlhttpRequest({
          method: 'POST',
          url,
          data: body,
          headers: headers || {},
          responseType: 'text',
          onload: (r) => resolve({ source: String(r.responseText || r.response || ''), status: r.status || 0 }),
          onerror: () => resolve({ source: '', status: 0 }),
          ontimeout: () => resolve({ source: '', status: 0 }),
        });
      } catch (e) {
        resolve({ source: '', status: 0 });
      }
    });

  // ── Bunkr CF-retry wrappers ───────────────────────────────────────────────

  async function bunkrGetWithCfRetry(url, warmUrlOrOrigin, allowWarmup = true) {
    let last = null;
    for (let attempt = 0; attempt <= CF_MAX_RETRIES; attempt++) {
      try {
        last = await gmGet(url);
      } catch (e) {
        last = null;
      }

      const dom = last?.dom;
      const source = last?.source || '';
      const status = Number(last?.status || 0);

      if (FASTFAIL_ON_403 && status === 403 && !allowWarmup) {
        banBase(warmUrlOrOrigin || url);
        return last || { dom: null, source: '' };
      }
      if (FASTFAIL_ON_403 && !allowWarmup && last && looksLikeCfChallenge(source, dom)) {
        banBase(warmUrlOrOrigin || url);
        return last || { dom: null, source: '' };
      }
      if (last && !looksLikeCfChallenge(source, dom)) return last;

      if (attempt < CF_MAX_RETRIES) {
        if (allowWarmup) {
          await cfWarmup(String(warmUrlOrOrigin || url));
        } else {
          await sleep(200);
        }
      }
    }
    return last || { dom: null, source: '' };
  }

  async function bunkrPostVsWithCfRetry(endpoint, slug, refererUrl, originUrl, allowWarmup = true) {
    let lastText = '';
    let lastStatus = 0;
    for (let attempt = 0; attempt <= CF_MAX_RETRIES; attempt++) {
      try {
        const response = await gmPost(endpoint, JSON.stringify({ slug }), {
          'Content-Type': 'application/json',
          Referer: refererUrl,
          Origin: originUrl,
        });
        lastText = String(response?.source || '');
        lastStatus = Number(response?.status || 0);
      } catch (e) {
        lastText = '';
        lastStatus = 0;
      }

      if (FASTFAIL_ON_403 && lastStatus === 403 && !allowWarmup) {
        banBase(originUrl || refererUrl || endpoint);
        return null;
      }
      if (FASTFAIL_ON_403 && !allowWarmup && looksLikeCfChallenge(lastText, null)) {
        banBase(originUrl || refererUrl || endpoint);
        return null;
      }
      try {
        return JSON.parse(lastText || '{}');
      } catch (e) {
        if (looksLikeCfChallenge(lastText, null) && attempt < CF_MAX_RETRIES) {
          if (allowWarmup) {
            await cfWarmup(String(refererUrl || originUrl || endpoint));
          } else {
            await sleep(200);
          }
          continue;
        }
        return null;
      }
    }
    return null;
  }

  // ── Bunkr data helpers ────────────────────────────────────────────────────

  function extractNameFromVsData(data) {
    try {
      const cands = [];
      const add = (v) => {
        if (!v) return;
        cands.push(typeof v === 'string' ? v : String(v));
      };
      add(data?.name);
      add(data?.filename);
      add(data?.file_name);
      add(data?.original);
      add(data?.title);
      if (data?.data && typeof data.data === 'object') {
        add(data.data.name);
        add(data.data.filename);
        add(data.data.file_name);
        add(data.data.original);
        add(data.data.title);
      }
      if (data?.file && typeof data.file === 'object') {
        add(data.file.name);
        add(data.file.filename);
        add(data.file.original);
        add(data.file.title);
      }
      const norm = (s) =>
        String(s || '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\s*\|\s*Bunkr\s*$/i, '')
          .trim();
      for (const raw of cands) {
        const t = norm(raw);
        if (!t || looksLikeCfFilenameHint(t)) continue;
        if (/\.[A-Za-z0-9]{1,8}$/.test(t)) return t;
      }
      for (const raw of cands) {
        const t = norm(raw);
        if (!t || looksLikeCfFilenameHint(t)) continue;
        return t;
      }
    } catch (e) {}
    return '';
  }

  function decodeFinalUrl(data) {
    try {
      if (!data || !data.url) return null;
      if (!data.encrypted) return data.url;
      const binaryString = atob(data.url);
      const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
      return Array.from(binaryString)
        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
        .join('');
    } catch (e) {
      return null;
    }
  }

  function extractSlugs(dom, nameHintBySlug) {
    const containers = dom?.querySelectorAll?.('.grid-images > div') || [];
    const slugs = [];
    for (const c of containers) {
      const a =
        c.querySelector('a[class="after:absolute after:z-10 after:inset-0"]') ||
        c.querySelector('a[href*="/f/"]') ||
        c.querySelector('a[href*="/v/"]') ||
        c.querySelector('a[href*="/d/"]');
      const href = a?.getAttribute?.('href') || '';
      const m = href.match(/\/(f|v|d)\/([^/?#]+)/i);
      if (!m || !m[2]) continue;
      const slug = m[2];
      slugs.push(slug);
      try {
        let hint = c?.getAttribute?.('title') || '';
        if (!hint) hint = c?.querySelector?.('.theName')?.textContent || '';
        if (!hint) hint = c?.querySelector?.('p.truncate')?.textContent || '';
        if (!hint) hint = c?.querySelector?.('.grid-images_box-txt p')?.textContent || '';
        hint = String(hint || '')
          .replace(/\s+/g, ' ')
          .trim();
        if (hint) nameHintBySlug.set(slug, hint);
      } catch (e) {}
    }
    return slugs;
  }

  // ── Main download logic ───────────────────────────────────────────────────

  async function downloadAlbum(btn) {
    btn.disabled = true;
    btn.textContent = 'Resolving...';

    try {
      const baseUrl = window.location.href.split('#')[0].split('?')[0].replace(/\/+$/, '');
      const albumTag = baseUrl.split('/').filter(Boolean).pop() || 'bunkr-album';

      const origin = (() => {
        try {
          return new URL(baseUrl).origin;
        } catch (e) {
          return 'https://bunkr.cr';
        }
      })();

      const albumPath = (() => {
        try {
          return new URL(baseUrl).pathname;
        } catch (e) {
          return '/a/' + albumTag;
        }
      })();

      const albumBasesAll = [origin, 'https://bunkr.pk', 'https://bunkr.cr'].filter((v, i, a) => a.indexOf(v) === i);
      const vsBasesAll = [...albumBasesAll];

      const nameHintBySlug = new Map();
      const seen = new Set();
      const resolved = [];

      const MAX_PAGES = 500;
      const CONCURRENCY = 4;
      let albumBaseChosen = null;

      for (let page = 1; page <= MAX_PAGES; page++) {
        const pageBases = albumBaseChosen
          ? [albumBaseChosen, ...filterBases(albumBasesAll).filter((b) => b !== albumBaseChosen)]
          : filterBases(albumBasesAll);

        let dom = null;
        let source = '';
        let slugs = [];

        for (const base of pageBases) {
          const base0 = base.replace(/\/$/, '');
          const candidate = `${base0}${albumPath}?page=${page}`;

          try {
            ({ dom, source } = await bunkrGetWithCfRetry(candidate, base0, base0 === 'https://bunkr.cr'));
          } catch (e) {
            dom = null;
            source = '';
          }

          if (looksLikeCfChallenge(source, dom)) continue;

          slugs = extractSlugs(dom, nameHintBySlug);
          if (page === 1 && !slugs.length) continue;

          if (!albumBaseChosen) albumBaseChosen = base0;
          break;
        }

        if (!dom || !slugs.length) break;

        const fresh = slugs.filter((s) => s && !seen.has(s));
        fresh.forEach((s) => seen.add(s));
        if (!fresh.length) break;

        const pageRefUrl = `${albumBaseChosen}${albumPath}?page=${page}`;
        btn.textContent = `Resolving p${page} (${resolved.length + fresh.length} files)...`;

        await asyncPool(CONCURRENCY, fresh, async (slug) => {
          let data = null;
          for (const base of filterBases(vsBasesAll)) {
            const base0 = base.replace(/\/$/, '');
            data = await bunkrPostVsWithCfRetry(
              `${base0}/api/vs`,
              slug,
              pageRefUrl,
              base0,
              base0 === 'https://bunkr.cr'
            );
            if (data && typeof data === 'object' && 'url' in data) break;
            data = null;
          }
          if (!data) return;

          let cdnUrl = decodeFinalUrl(data);
          if (!cdnUrl || typeof cdnUrl !== 'string') return;
          cdnUrl = cdnUrl.trim();
          if (cdnUrl.startsWith('//')) cdnUrl = 'https:' + cdnUrl;

          const hint = nameHintBySlug.get(slug) || extractNameFromVsData(data) || '';
          resolved.push({ url: cdnUrl, hint });
        });
      }

      if (!resolved.length) {
        btn.textContent = 'No files found';
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = 'Download All';
        }, 3000);
        return;
      }

      btn.textContent = `Downloading ${resolved.length} files...`;

      for (let i = 0; i < resolved.length; i++) {
        const { url, hint } = resolved[i];
        const urlBasename = decodeURIComponent(url.split('/').pop().split('?')[0]) || `file-${i + 1}`;
        const filename = sanitizeFilename(hint || urlBasename) || sanitizeFilename(urlBasename) || `file-${i + 1}`;

        GM_download({ url, name: `${albumTag}/${filename}`, saveAs: false, headers: { Referer: 'https://bunkr.si' } });
        await sleep(150);

        btn.textContent = `Downloading ${i + 1}/${resolved.length}...`;
      }

      btn.textContent = `Done (${resolved.length} files)`;
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Download All';
      }, 5000);
    } catch (err) {
      console.error('[BunkrAlbumDownloader]', err);
      btn.textContent = 'Error — see console';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Download All';
      }, 3000);
    }
  }

  // ── Button injection ──────────────────────────────────────────────────────

  function injectButton() {
    const advToggle = document.getElementById('advToggle');
    if (!advToggle) return false;

    const leftTools = advToggle.closest('.left-tools');
    if (!leftTools) return false;

    if (document.getElementById('bunkrAlbumDlBtn')) return true;

    const btn = document.createElement('button');
    btn.id = 'bunkrAlbumDlBtn';
    btn.type = 'button';
    btn.textContent = 'Download All';
    btn.className = advToggle.className;

    btn.addEventListener('click', () => downloadAlbum(btn));
    advToggle.insertAdjacentElement('afterend', btn);
    return true;
  }

  if (!injectButton()) {
    const obs = new MutationObserver(() => {
      if (injectButton()) obs.disconnect();
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
})();
