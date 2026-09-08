export type Snapshot = {
  version: number; repositoryId: number; repository: string; branch: string; commit: string;
  checkedAt: string; downloadedAt: string;
  files: { path: string; sha: string; content: string }[];
};
export type Connection = { repository: string; token?: string };
