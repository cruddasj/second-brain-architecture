# Browser explorer adapter

Follow the [Plugin contract](../../CONTRACT.md) and [Core contract](../../../2.core/CONTRACT.md).

This is a small browser-side GitHub adapter, not another application. The existing explorer in `3.add-ons/browser-explorer` owns the UI, installable static build and device snapshot. Its build resolves this adapter through the plugin registry.

The user enters the repository they explicitly want to read. Guide them to create a fine-grained PAT with only that repository selected and Contents set to Read-only; Metadata read access is implicit. Suggest 30 days initially. Organization approval may be required. The app cannot prove that a supplied token has no additional permissions; it only makes GET requests.

`adapter.mjs` downloads the default branch at a pinned commit through `https://api.github.com`, with credentialed requests excluded from caching and redirects disallowed. V1 supports up to 5,000 Markdown files / 25 MB, rejects truncated trees and requires `2.core/CONTRACT.md` and `2.core/index.md`. No token or content is sent to an application backend. Tokens are held by the app in memory, or in browser storage only if the user opts in.

From the repository root, after installing and building the add-on, run:

```bash
node --test 1.plugins/github/browser-explorer/adapter.test.mjs
node --test 1.plugins/github/browser-explorer/browser.test.mjs
```

For public static hosting, see [Pages deployment](pages.md).

The browser test uses the add-on's test dependency and installed Playwright Chromium, an isolated temporary browser profile, a local static server and mocked GitHub responses. It never needs a real PAT. It checks sync, graph and reader source consistency, updates, authentication failure, offline reload and disconnect.
