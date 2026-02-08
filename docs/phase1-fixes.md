# Quick Fix Guide - Phase 1 Issues

## Issue 1: GitHub Actions Workflow

**Problem:** Workflow tries to build workspaces individually instead of using Turbo

**Fix:**
```yaml
# .github/workflows/lint.yml
- name: Run linter
  run: npm run lint

- name: Run builds (type check)
  run: npm run build
```

## Issue 2: Missing Foundry Dependencies

**Problem:** OpenZeppelin contracts not installed

**Fix:**
```bash
cd packages/contracts
forge install OpenZeppelin/openzeppelin-contracts
```

## Issue 3: API ESLint Config

**Problem:** Missing ESLint configuration

**Create:** `apps/api/.eslintrc.js`
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es6: true
  }
};
```

## Issue 4: API Directory Structure

**Create these folders:**
```bash
cd apps/api/src
mkdir routes services jobs utils
```

## Issue 5: Package Name Alignment

**Fix:** `apps/web/package.json`
```json
{
  "name": "@pontiff/web",  // Change from "web"
  ...
}
```

---

All fixes are optional for Phase 2 but recommended for production quality.
