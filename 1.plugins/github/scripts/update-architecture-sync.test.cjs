const { test } = require('node:test');
const assert = require('node:assert/strict');
const update = require('./update-architecture-sync.cjs');
const target = 'a'.repeat(40);
const old = 'b'.repeat(40);

function fixture({ previous = null, status = 'behind', repository = 'cruddasj/second-brain-architecture', merged = true, ref = 'main', conflict = false } = {}) {
  const [owner, repo] = repository.split('/');
  const record = { upstream_repository: 'cruddasj/second-brain-architecture', last_synced_commit: previous, extra: 'preserved' };
  const writes = [];
  let reads = 0;
  const args = {
    context: { repo: { owner, repo }, payload: { pull_request: { merged, base: { ref }, merge_commit_sha: target, number: 64 } } },
    core: { info() {} },
    github: { rest: { repos: {
      async getContent(input) {
        assert.equal(input.ref, 'main');
        reads++;
        return { data: { sha: `file-${reads}`, content: Buffer.from(JSON.stringify(record)).toString('base64') } };
      },
      async compareCommits(input) {
        assert.equal(input.base, target);
        assert.equal(input.head, previous);
        return { data: { status } };
      },
      async createOrUpdateFileContents(input) {
        writes.push(input);
        if (conflict && writes.length === 1) throw Object.assign(new Error('Conflict'), { status: 409 });
      },
    } } },
  };
  return { args, writes, reads: () => reads };
}

test('stamps merged SHA, preserves other fields and updates only the baseline on main', async () => {
  const f = fixture();
  await update(f.args);
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].path, '1.plugins/github/architecture-sync.json');
  assert.equal(f.writes[0].branch, 'main');
  assert.deepEqual(JSON.parse(Buffer.from(f.writes[0].content, 'base64')), {
    upstream_repository: 'cruddasj/second-brain-architecture', last_synced_commit: target, extra: 'preserved',
  });
});

test('skips private copies, forks, unmerged PRs and other base branches before reads', async () => {
  for (const options of [{ repository: 'example/private' }, { merged: false }, { ref: 'develop' }]) {
    const f = fixture(options);
    await update(f.args);
    assert.equal(f.reads(), 0);
    assert.equal(f.writes.length, 0);
  }
});

test('does not regress the baseline on repeated or out-of-order events', async () => {
  for (const options of [{ previous: target }, { previous: old, status: 'ahead' }, { previous: old, status: 'identical' }]) {
    const f = fixture(options);
    await update(f.args);
    assert.equal(f.writes.length, 0);
  }
});

test('advances a previous ancestor and rereads after a concurrent file conflict', async () => {
  const f = fixture({ previous: old, conflict: true });
  await update(f.args);
  assert.equal(f.writes.length, 2);
  assert.equal(f.writes[1].sha, 'file-2');
});

test('fails closed on invalid or divergent baselines and protected-branch errors', async () => {
  for (const options of [{ previous: 'invalid' }, { previous: old, status: 'diverged' }]) {
    const f = fixture(options);
    await assert.rejects(update(f.args));
    assert.equal(f.writes.length, 0);
  }
  const f = fixture();
  f.args.github.rest.repos.createOrUpdateFileContents = async () => { throw Object.assign(new Error('Protected'), { status: 403 }); };
  await assert.rejects(update(f.args), /Protected/);
  assert.equal(f.reads(), 1);
});

test('a conflict retry skips a merge superseded by a newer baseline', async () => {
  const f = fixture({ conflict: true });
  const read = f.args.github.rest.repos.getContent;
  f.args.github.rest.repos.getContent = async (input) => {
    const response = await read(input);
    if (f.reads() === 2) {
      response.data.content = Buffer.from(JSON.stringify({
        upstream_repository: 'cruddasj/second-brain-architecture', last_synced_commit: old,
      })).toString('base64');
    }
    return response;
  };
  f.args.github.rest.repos.compareCommits = async () => ({ data: { status: 'ahead' } });
  await update(f.args);
  assert.equal(f.writes.length, 1);
  assert.equal(f.reads(), 2);
});

test('conflicts are bounded and missing merge SHA or changed upstream fails closed', async () => {
  const f = fixture();
  f.args.github.rest.repos.createOrUpdateFileContents = async () => { throw Object.assign(new Error('Conflict'), { status: 409 }); };
  await assert.rejects(update(f.args), /Conflict/);
  assert.equal(f.reads(), 5);
  const missing = fixture();
  missing.args.context.payload.pull_request.merge_commit_sha = null;
  await assert.rejects(update(missing.args), /Missing/);
  assert.equal(missing.reads(), 0);
  const changed = fixture();
  changed.args.github.rest.repos.getContent = async () => ({ data: { content: Buffer.from(JSON.stringify({ upstream_repository: 'example/other', last_synced_commit: null })).toString('base64') } });
  await assert.rejects(update(changed.args), /Unexpected/);
  assert.equal(changed.writes.length, 0);
});
