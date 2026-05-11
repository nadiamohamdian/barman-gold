# E2E Tests with Playwright

This directory contains end-to-end tests for the GoldShop web application using Playwright.

## Setup

1. Install Playwright dependencies:
```bash
pnpm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
pnpm test:e2e
```

### Run tests with UI
```bash
pnpm test:e2e:ui
```

### Run tests in headed mode (visible browser)
```bash
pnpm test:e2e:headed
```

### Run tests in debug mode
```bash
pnpm test:e2e:debug
```

### Run specific test file
```bash
npx playwright test home.spec.ts
```

### Run tests on specific browser
```bash
npx playwright test --project=chromium
```

## Test Structure

- `home.spec.ts` - Tests for the home page functionality
- `plp.spec.ts` - Tests for the product listing page
- `pdp.spec.ts` - Tests for the product detail page

## CI/CD

Tests can run headless in CI environments. The configuration automatically detects CI and adjusts settings accordingly.

## Test Data

Tests use fallback selectors to work with the current implementation. For better test reliability, consider adding `data-testid` attributes to key components.

## Debugging

- Use `pnpm test:e2e:debug` for step-by-step debugging
- Use `pnpm test:e2e:ui` for interactive test development
- Check `test-results/` directory for screenshots and traces on failure
