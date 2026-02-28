# Rollback Guide - ScamGuard

## Branch strategy

| Branch | Description |
|--------|-------------|
| `main` | Development and staging work |
| `production` | Deploy-only branch that feeds CI/CD |

## Tagging releases

Versioned tags are required so you can rollback with precision. Create and push tags with:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

CI/CD and `deploy.sh --rollback` use tags to identify safe checkpoints.

## Performing a rollback

1. Fetch the latest tags: `git fetch origin production --tags --prune`.
2. Run the rollback helper on the VPS (or via CI using the same command):

```bash
./deploy.sh --rollback v1.0.0
```

The script will:
- verify the tag exists
- check out the tag in a clean working tree
- install dependencies, run migrations, build and reload PM2
- return the working tree back to `production` at the end

## Creating a hotfix after rollback

Once the service is stable, create a hotfix branch off the tag:

```bash
git checkout -b hotfix/rollback-fix v1.0.0
# implement fixes, run tests/build
git push origin hotfix/rollback-fix
```

Merge that branch into `main`, then cherry-pick or merge into `production` before your next deploy.

## Audit readiness

- Always document which tag was rolled back to in your changelog or incident report.
- Keep track of deployments in GitHub (release notes + tags) so auditors can map running versions to commits.
