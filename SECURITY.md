# Security policy

## Reporting a vulnerability

Report security problems privately, especially content execution in the browser
explorer, credential exposure, unsafe source handling or validation bypasses.
Use **Security → Report a vulnerability** on the upstream repository when that
option is available. If it is unavailable, open an issue asking only for a private
reporting channel; do not include exploit details or sensitive data. No private
reporting address or response-time commitment is implied by this scaffold.

Include the affected commit, component, impact, reproduction steps using synthetic
data, and any suggested fix. Never attach a real second brain, access token,
browser-storage dump or private source document. Coordinate disclosure with the
maintainers before publishing details.

## Supported versions

Security fixes target the latest default-branch revision. Older snapshots have no
guaranteed backports; update and retest before reporting. Deployments and forks
must establish their own private reporting channel and update process.

## Protecting a second brain

Keep repositories, backups and derived explorer data private. The explorer's
browser storage is not encrypted by the application. Use trusted devices, grant
integrations minimum access, and keep credentials outside Git. Local development
servers and container images can contain repository knowledge: do not publish
them or expose them to untrusted networks.

Ignore rules and validators reduce mistakes; they do not prove that content is
safe to publish. Review staged content, including allowed text sources. If a
credential is exposed, revoke or rotate it immediately; deleting a file does not
remove copies from Git history, caches or backups.
