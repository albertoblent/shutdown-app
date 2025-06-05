# Codecov Setup Instructions

This document provides step-by-step instructions for setting up Codecov integration with our GitHub repository.

## Prerequisites

- GitHub repository with CI/CD pipeline configured
- Codecov action already added to `.github/workflows/frontend.yaml`

## Setup Steps

### 1. Sign Up for Codecov

1. Go to [codecov.io](https://codecov.io)
2. Click "Sign up with GitHub"
3. Authorize Codecov to access your GitHub account

### 2. Add Repository to Codecov

1. After signing in, click "Add new repository"
2. Find `albertoblent/shutdown-app` in the list
3. Click "Setup repo" or similar button

### 3. Get Upload Token

1. On the repository setup page, you'll see an "Upload Token"
2. Copy this token (it looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 4. Add Token to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/albertoblent/shutdown-app`
2. Click **Settings** (top navigation)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in:
   - **Name**: `CODECOV_TOKEN`
   - **Secret**: [paste the token from step 3]
6. Click **Add secret**

## Verification

Once setup is complete:

1. **Push any commit** to trigger the CI pipeline
2. **Check the Actions tab** in GitHub - the coverage upload should succeed
3. **Visit your Codecov dashboard** - you should see coverage reports
4. **PR comments** will automatically include coverage information

## Expected Coverage Reports

After setup, you'll get:

- **Coverage dashboard** at `https://codecov.io/gh/albertoblent/shutdown-app`
- **Coverage badges** (optional, for README)
- **PR comments** showing coverage changes
- **Trend tracking** over time

## Current Coverage Status

As of the last test run:
```
All files    |   92.64 |    79.01 |   96.87 |   92.64 |
 types       |     100 |      100 |   94.44 |     100 |
 utils       |   88.47 |    72.13 |     100 |   88.47 |
```

**66 tests total** with 92%+ coverage across all utilities and data models.

## Troubleshooting

### Upload Fails
- Verify the `CODECOV_TOKEN` secret is set correctly
- Check that the token matches the one from Codecov dashboard

### No Coverage Reports
- Ensure tests are running successfully in CI
- Check that `frontend/coverage/` directory is being generated

### Coverage Not Updating
- Make sure you're pushing to branches that trigger CI
- Verify the coverage files are being uploaded (check CI logs)

---

## Next Steps After Setup

1. **Add coverage badge** to README (optional)
2. **Set coverage targets** in Codecov settings
3. **Configure PR checks** to require coverage thresholds
4. **Monitor coverage trends** as we build new features

This setup is free for public repositories and provides professional-grade coverage tracking for our development workflow.