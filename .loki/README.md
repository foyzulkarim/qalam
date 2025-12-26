# Visual Regression Testing with Loki

This folder contains baseline screenshots for visual regression testing.

## How It Works

1. **Reference images** (`.loki/reference/`) - Committed to git, these are the "expected" screenshots
2. **Current images** (`.loki/current/`) - Generated during tests, compared against reference
3. **Difference images** (`.loki/difference/`) - Generated when tests fail, showing visual diffs

## Local Development

### Prerequisites
- Docker must be running

### Commands

```bash
# Run visual tests (compares current vs reference)
npm run loki:test

# Update reference images (after intentional UI changes)
npm run loki:update

# Run against built Storybook (CI mode)
npm run build-storybook
npm run loki:ci
```

## Workflow for UI Changes

1. Make your UI changes
2. Run `npm run storybook` to preview in Storybook
3. Run `npm run loki:test` to see if visuals changed
4. If changes are intentional, run `npm run loki:update`
5. Commit the updated reference images in `.loki/reference/`
6. Push and create PR

## CI Pipeline

The GitHub Actions workflow will:
1. Build Storybook
2. Run Loki against reference images
3. Fail if any visual differences are detected
4. Upload diff images as artifacts for review

## First Time Setup

If no reference images exist yet:

```bash
# Start Storybook
npm run storybook

# In another terminal, generate initial references
npm run loki:update
```

Then commit the `.loki/reference/` folder.
