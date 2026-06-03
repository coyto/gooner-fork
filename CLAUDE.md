# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GoonerFork is a collection of UserScripts for downloading and viewing videos from adult content platforms. Userscripts live in `src/` and compiled output goes to `dist/`.

## Package Manager

Use **pnpm**, not npm or yarn.

```
pnpm install
pnpm run build    # node build.js — being written, may not exist yet
pnpm run dev      # watch mode + dev server — being written, may not exist yet
pnpm run lint     # eslint (no config file yet — may fail)
pnpm run format   # prettier --write .
```

## Code Style (Prettier)

- Single quotes, no semicolons
- 120-character line width
- 2-space indentation
- Trailing commas in ES5 positions

## UserScript Conventions

Every file in `src/` must begin with a `// ==UserScript==` metadata block. Preserve all existing `@require`, `@grant`, and `@match` directives — removing them breaks the script in Tampermonkey/Violentmonkey.

Testing is manual: install the script via Tampermonkey or Violentmonkey and verify on the target site. A dev server (`server.js`) is planned but not yet present.

## Vendored File

`src/forum-post-downloader.js` (8,100+ lines) is a third-party vendored script from SkyCloudDev/ForumPostDownloader. Do not refactor or restructure it — only make targeted edits when necessary.
