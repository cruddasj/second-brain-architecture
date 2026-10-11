---
title: Activity log
type: log
updated: 2026-10-11
---

# Activity log

Append-only record of authorised changes to the second brain. Add new entries at the top beneath this introduction. Correct earlier entries by adding a new entry rather than rewriting history.

No private instance activity is included in the public scaffold.

## 2026-10-11 — Track explicitly selected reader headings
- Transaction: 4dd2e748-a02f-4ad4-9950-bc66f471d80a
- Affected paths: `3.add-ons/browser-explorer/app/records/[...path]/table-of-contents.tsx`, `3.add-ons/browser-explorer/tests/heading-navigation.test.mjs`, `3.add-ons/browser-explorer/tests/heading-navigation-browser.test.mjs`, `3.add-ons/browser-explorer/tests/markdown-reader.test.mjs`, `2.core/system/activity-log.md`
- Commit: enclosing commit

Keep the requested contents heading active when native fragment scrolling is clamped at the end of the document. Resume tracking all heading positions within the reader below its search toolbar after scrolling away, with browser coverage for short sections, keyboard navigation, fragments and desktop/mobile scrolling.

## 2026-10-11 — Move reader contents left and center the connection icon
- Transaction: 8813d677-6ee6-4ace-b65b-b68e6c319934
- Affected paths: `3.add-ons/browser-explorer/app/application-shell.tsx`, `3.add-ons/browser-explorer/app/record/page.tsx`, `3.add-ons/browser-explorer/app/globals.css`, `3.add-ons/browser-explorer/tests/markdown-reader.test.mjs`, `2.core/system/activity-log.md`
- Commit: enclosing commit

Move the desktop On this page panel to the left of the article. Replace the paired repository sync arrows with a single fa-cloud-arrow-down icon using the shared centered menu container.
