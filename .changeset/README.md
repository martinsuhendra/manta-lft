# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) for version bumps and `CHANGELOG.md` generation.

## Commands

| Command | When to use |
| ------- | ----------- |
| `pnpm changeset` | After completing a feature, fix, or breaking change — pick patch/minor/major and write a short summary |
| `pnpm release` | On `main` with a clean tree — bumps version, updates changelog, commits, tags, and pushes |
| `pnpm release:version` | Bump only (`changeset version`) — useful for debugging |
| `pnpm release:tag` | Creates git tags via changesets (monorepo helper; not used by `pnpm release`) |

## Workflow

### During a feature or fix (on your branch / PR)

```bash
pnpm changeset
```

1. Choose **patch**, **minor**, or **major**
2. Write a clear summary (this becomes the changelog entry)
3. Commit the generated `.changeset/*.md` file with your PR

### When ready to ship (on `main`)

```bash
pnpm release
```

This runs `changeset version`, commits `package.json` + `CHANGELOG.md` as `chore: release vX.Y.Z`, tags `vX.Y.Z`, and pushes `main` with tags.

Requirements: be on `main`, working tree clean, and at least one pending changeset.

## Version bump guide

- **patch** — bug fixes, small UI tweaks, refactors with no user-facing impact
- **minor** — new features, non-breaking API or UI additions
- **major** — breaking changes (auth flows, DB migrations requiring manual steps, removed endpoints)

## Notes

- This app is `private: true` — releases update version and changelog only; nothing is published to npm.
- Release commits are manual (`commit: false` in config) so you control the commit message and tagging.
- Pending changeset files in `.changeset/` should be committed to git; they are consumed and removed by `pnpm release`.
