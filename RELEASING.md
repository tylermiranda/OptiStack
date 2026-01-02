# How to Release a New Version

The release process is automated using GitHub Actions. When you push a new version tag (e.g., `v1.2.0`), a workflow automatically builds the Docker image and publishes it to GitHub Container Registry.

## Step-by-Step Guide

### 1. Update Version in Code
First, update the version number in `package.json` to match your new release (e.g., changing `1.0.0` to `1.1.0`).

```bash
# You can edit the file manually, or use npm:
npm version 1.1.0 --no-git-tag-version
```

### 2. Commit the Change
Commit the version bump to the `main` branch.

```bash
git add package.json
git commit -m "Bump version to 1.1.0"
git push origin main
```

### 3. Create and Push the Tag
This is the step that triggers the release build.

**Option A: Using Command Line (Recommended)**
```bash
# Create a tag (must start with 'v')
git tag v1.1.0

# Push the tag to GitHub
git push origin v1.1.0
```

**Option B: Using GitHub UI**
1. Go to the "Releases" section of your repository.
2. Click "Draft a new release".
3. Click "Choose a tag" -> Create new tag (e.g. `v1.1.0`).
4. Give the release a title and description.
5. Click "Publish release".

## What Happens Next?
1. The **"Docker Build and Publish"** GitHub Action starts automatically.
2. It builds the Docker image for both `amd64` and `arm64` platforms.
3. It pushes the following tags to GitHub Container Registry:
   - `ghcr.io/tylermiranda/optistack:1.1.0` (Exact version)
   - `ghcr.io/tylermiranda/optistack:1.1` (Minor version alias)
   - `ghcr.io/tylermiranda/optistack:latest` (Updated latest)

## Verifying the Release
Users can verify they are on the new version by pulling the image:

```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```
