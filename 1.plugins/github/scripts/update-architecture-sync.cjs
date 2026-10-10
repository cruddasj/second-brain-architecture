const UPSTREAM = 'cruddasj/second-brain-architecture';
const PATH = '1.plugins/github/architecture-sync.json';
const SHA = /^[0-9a-f]{40}$/;

// Only public upstream merges stamp the distribution; private syncs stay manual.
module.exports = async ({ github, context, core }) => {
  const pr = context.payload.pull_request;
  const repository = `${context.repo.owner}/${context.repo.repo}`;
  if (repository !== UPSTREAM || !pr?.merged || pr.base.ref !== 'main') return;
  const target = pr.merge_commit_sha;
  if (!SHA.test(target ?? '')) throw new Error('Missing full merged commit SHA');
  const params = { ...context.repo };

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: file } = await github.rest.repos.getContent({
      ...params, path: PATH, ref: 'main',
    });
    const record = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    if (record.upstream_repository !== UPSTREAM) {
      throw new Error('Unexpected architecture upstream; refusing to stamp');
    }
    const previous = record.last_synced_commit;
    if (previous === target) return;
    if (previous !== null) {
      if (!SHA.test(previous ?? '')) throw new Error('Invalid existing baseline');
      const { data: comparison } = await github.rest.repos.compareCommits({
        ...params, base: target, head: previous,
      });
      // A delayed event must not overwrite a newer merged baseline.
      if (['ahead', 'identical'].includes(comparison.status)) return;
      if (comparison.status !== 'behind') throw new Error('Baseline histories diverge');
    }
    record.last_synced_commit = target;
    try {
      await github.rest.repos.createOrUpdateFileContents({
        ...params, path: PATH, branch: 'main', sha: file.sha,
        message: `chore(sync): record architecture baseline for PR #${pr.number}`,
        content: Buffer.from(`${JSON.stringify(record, null, 2)}\n`).toString('base64'),
      });
      core.info(`Recorded merged architecture commit ${target}`);
      return;
    } catch (error) {
      // Another merge may have updated the file since it was read.
      if (error.status !== 409 || attempt === 4) throw error;
    }
  }
};
