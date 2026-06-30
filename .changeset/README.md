# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) for version bumps and `CHANGELOG.md` generation.

## Commands

| Command | When to use |
| ------- | ----------- |
| `pnpm changeset` | After completing a feature, fix, or breaking change — pick patch/minor/major and write a short summary |
| `pnpm release` | On `main` when you are ready to ship — bumps `package.json` version and updates `CHANGELOG.md` |
| `pnpm release:tag` | After the release commit — creates `vX.Y.Z` git tags |

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
git add package.json CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

Replace `X.Y.Z` with the new version from `package.json`.

## Version bump guide

- **patch** — bug fixes, small UI tweaks, refactors with no user-facing impact
- **minor** — new features, non-breaking API or UI additions
- **major** — breaking changes (auth flows, DB migrations requiring manual steps, removed endpoints)

## Notes

- This app is `private: true` — releases update version and changelog only; nothing is published to npm.
- Release commits are manual (`commit: false` in config) so you control the commit message and tagging.
- Pending changeset files in `.changeset/` should be committed to git; they are consumed and removed by `pnpm release`.
