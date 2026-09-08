# Browser deployment to GitHub Pages

The [browser adapter](README.md) supplies optional read-only GitHub access. The portable explorer owns the static shell and the `NEXT_PUBLIC_BASE_PATH` build option.

## Review and deployment

The root `.github/workflows/browser-pages.yml` file is a GitHub-required activation shim for this deployment. It runs the build and tests on pull requests, and publishes only from `main`. It uploads only `3.add-ons/browser-explorer/out`, never the repository or a development data directory. Topic branches cannot deploy, including through manual dispatch.

After reviewing and merging the code manually:

1. In the repository's **Settings > Pages > Build and deployment**, select **GitHub Actions** as the source.
2. Allow the `github-pages` environment to deploy from `main` only.
3. Run **Browser Pages** from `main` if the merge run took place before Pages was enabled. Later pushes to `main` run it automatically.
4. Open the URL reported by the deployment job. For a project repository, it has the form `https://OWNER.github.io/REPOSITORY/`.

The workflow derives the path from the current public repository name. It does not configure a data repository, token, custom domain or personal setting. This workflow targets project Pages paths; an account-root site or custom domain needs its base-path setting adjusted before building.

See GitHub's [custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [publishing source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Build and verification

From `3.add-ons/browser-explorer`, run `npm ci`, then `NEXT_PUBLIC_BASE_PATH=/REPOSITORY npm test` and `NEXT_PUBLIC_BASE_PATH=/REPOSITORY npm run preview`. Open `/REPOSITORY/connection/` on the preview server. Use the same path for build, tests and preview.

The production export starts empty. Each visitor supplies their own repository and token at runtime. Downloads go directly to GitHub and stay in that visitor's browser; they are not added to Pages or the public repository. Device storage and service-worker caches use the application path as a namespace, but browser storage is still accessible to other scripts on the same origin. Path namespacing is not a security boundary.

The workflow tests use synthetic fixtures and no real credentials. Builds remove local and demo data before export, and the shell tests check that those files are absent from the published output.

## Removal

Remove the activation workflow to stop future deployments. Disabling an existing Pages site is a separate repository administration action. Removing this adapter leaves local browsing and Core usable.
