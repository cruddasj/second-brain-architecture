const API = "https://api.github.com";
const maxFiles = 5000;
const maxBytes = 25 * 1024 * 1024;

export function repositoryName(input) {
  const value = input.trim().replace(/^https:\/\/github\.com\//i, "").replace(/\/$/, "").replace(/\.git$/, "");
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(value) || value.split("/")[1] === "." || value.split("/")[1] === "..") throw new Error("Enter a GitHub repository URL or owner/repository.");
  return value;
}

export function tokenValue(input) {
  const value = input.trim();
  if (!/^github_pat_[A-Za-z0-9_]+$/.test(value)) throw new Error("Use a fine-grained personal access token (starting github_pat_), with only your second-brain repository selected and Contents set to Read-only.");
  return value;
}

export function tokenSetupURL(repository) {
  const params = new URLSearchParams({ name: "Second Brain Reader", description: "Read my second brain on this device", expires_in: "30", contents: "read" });
  try { params.set("target_name", repositoryName(repository).split("/")[0]); } catch { /* The user can select their resource owner on the setup page. */ }
  return `https://github.com/settings/personal-access-tokens/new?${params}`;
}

export async function downloadSnapshot({ repository, token, previous, signal, onProgress = (_message) => {}, request = fetch }) {
  const name = repositoryName(repository);
  const credential = tokenValue(token);
  async function get(endpoint, accept = "application/vnd.github+json") {
    signal?.throwIfAborted();
    const response = await request(`${API}${endpoint}`, {
      method: "GET", headers: { Authorization: `Bearer ${credential}`, Accept: accept, "X-GitHub-Api-Version": "2022-11-28" },
      signal, cache: "no-store", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer",
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Your token has expired or was revoked. Replace it in Connection settings. Your saved content is still available.");
      if (response.status === 404) throw new Error("Repository or file unavailable. Check the repository name and that this token has access to that repository.");
      if (response.status === 403 || response.status === 429) {
        if (response.headers.get("x-ratelimit-remaining") === "0" || response.status === 429 || response.headers.has("retry-after")) throw new Error("GitHub is limiting requests. Wait before trying again; your saved content is unchanged.");
        throw new Error("GitHub denied access. Check Contents: Read-only, repository selection and any organisation approval required for the token.");
      }
      throw new Error(`GitHub could not complete the download (HTTP ${response.status}). Your saved content is unchanged.`);
    }
    return response.json();
  }
  onProgress("Checking the default branch…");
  const repo = await get(`/repos/${name}`);
  if (!Number.isSafeInteger(repo.id) || typeof repo.default_branch !== "string" || typeof repo.full_name !== "string") throw new Error("GitHub returned an invalid repository response.");
  if (previous && previous.repositoryId !== repo.id) throw new Error("This repository now identifies a different repository. Disconnect before connecting to it.");
  const commit = await get(`/repos/${name}/commits/${encodeURIComponent(repo.default_branch)}`);
  if (!/^[a-f0-9]{40}$/.test(commit.sha) || !/^[a-f0-9]{40}$/.test(commit.commit?.tree?.sha)) throw new Error("GitHub returned an invalid commit response.");
  const checkedAt = new Date().toISOString();
  if (previous?.commit === commit.sha && previous.branch === repo.default_branch) return { ...previous, repository: repo.full_name, checkedAt };
  onProgress("Reading the repository file list…");
  const tree = await get(`/repos/${name}/git/trees/${commit.commit.tree.sha}?recursive=1`);
  if (tree.truncated || !Array.isArray(tree.tree)) throw new Error("This repository is too large for V1 to list safely. Your saved content is unchanged.");
  const files = tree.tree.filter((item) => item.type === "blob" && item.mode !== "120000" && typeof item.path === "string" && item.path.endsWith(".md") && !item.path.split("/").some((part) => [".git", ".next", "node_modules", "dist", "out"].includes(part)));
  if (!files.some((item) => item.path === "2.core/CONTRACT.md") || !files.some((item) => item.path === "2.core/index.md")) throw new Error("This does not appear to be a second-brain repository: 2.core/CONTRACT.md and 2.core/index.md are required.");
  if (files.length > maxFiles || files.reduce((sum, f) => sum + (f.size || 0), 0) > maxBytes) throw new Error("V1 supports up to 5,000 Markdown files and 25 MB of Markdown. Your saved content is unchanged.");
  const oldFiles = new Map((previous?.files || []).map((file) => [file.path, file]));
  const downloaded = [];
  let bytes = 0;
  for (const [index, file] of files.entries()) {
    signal?.throwIfAborted();
    if (!/^[a-f0-9]{40}$/.test(file.sha) || file.path.split("/").some((part) => !part || part === "." || part === "..") || file.path.includes("\\")) throw new Error("The repository contains an unsupported file path.");
    onProgress(`Reading Markdown ${index + 1} of ${files.length}…`);
    const old = oldFiles.get(file.path);
    let content = old?.sha === file.sha ? old.content : undefined;
    if (content === undefined) {
      const blob = await get(`/repos/${name}/git/blobs/${file.sha}`);
      if (blob.encoding !== "base64" || typeof blob.content !== "string" || blob.size > maxBytes) throw new Error("A Markdown file could not be read safely.");
      const raw = Uint8Array.from(atob(blob.content.replace(/\s/g, "")), (char) => char.charCodeAt(0));
      content = new TextDecoder("utf-8", { fatal: true }).decode(raw);
    }
    bytes += new TextEncoder().encode(content).length;
    if (bytes > maxBytes) throw new Error("The downloaded Markdown exceeds V1's 25 MB limit.");
    downloaded.push({ path: file.path, sha: file.sha, content });
  }
  return { version: 1, repositoryId: repo.id, repository: repo.full_name, branch: repo.default_branch, commit: commit.sha, checkedAt, downloadedAt: checkedAt, files: downloaded };
}

export const setup = { label: "GitHub repository", tokenLabel: "Paste your token", instructions: "GitHub will open with most choices already filled in. Select only your second-brain repository, check that Contents says Read-only, then create the token and copy it back here. A 30-day expiry is a good place to start.", privacy: "The app connects directly to GitHub to download your notes. It does not send your notes or token to a separate app server, and it does not track how you use the app. Your downloaded notes stay in this browser. If you choose to remember your token, it is also saved here. Only use that option on a device you trust, as the app does not encrypt its saved data. You can inspect the application’s source code to check how it works." };
