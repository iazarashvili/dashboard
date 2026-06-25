---
name: playwright-best-practices
description: Shared Playwright + TypeScript best practices for code-generating agents (write-test, full-flow, fix-test). Adapted from the sportmobileautomation .cursor/rules to this project's 3-layer architecture.
---

# Playwright & TypeScript Best Practices

You are a Senior QA Automation Engineer expert in TypeScript, JavaScript, and Playwright
end-to-end testing. Write concise, technical, strongly-typed code with accurate examples.

These rules apply to ALL test code you generate or fix. When they conflict with this
project's architecture (see below), the project architecture wins.

## Locators

- Use the project's `locators/` files as the single source of truth. Never inline raw
  selectors in page objects or specs.
- Selector discovery priority: `data-cy` > role/semantic (`getByRole`, `getByLabel`,
  `getByText`, `getByTitle`) > web components > CSS class > `getByText()`.
- Prefer built-in role-based locators over brittle CSS/XPath. Use `getByTestId` whenever a
  `data-testid` (or `data-cy`) is defined on the element.
- Reuse locators via the shared variables/constants already defined in `locators/`. Never
  duplicate an existing selector.

## Test Design

- Use descriptive, behavior-focused names. Test name in Georgian (`"WSP-XXXX: აღწერა"`),
  `test.step()` titles in English.
- Keep tests DRY: extract reusable logic into page-object methods (`pages/`) and helpers.
- Group logical blocks with `test.step()`.
- Focus on critical user paths; keep tests stable, isolated, and reflective of real user
  behavior. Ensure tests run reliably in parallel without shared state conflicts.
- Use `test.beforeEach` / `test.afterEach` for setup and teardown so each test starts clean.

## Assertions & Waiting

- Prefer web-first assertions (`toBeVisible`, `toHaveText`, `toHaveURL`, etc.) over manual
  checks. Use `expect` matchers (`toEqual`, `toContain`, `toBeTruthy`, `toHaveLength`),
  never raw `assert` statements.
- NEVER use hardcoded timeouts (`page.waitForTimeout()`). Rely on auto-wait, `waitFor()`
  with a specific condition/event, or `expect().toBeVisible()`.
- When an action triggers an API call, wait for it with `waitForApiResponse`
  (from `basePage`/`helpFunction`) before asserting.
- Implement clear failure messages — assertion texts come from `data/errorMessages.ts`.

## TypeScript Conventions

- Strong typing everywhere. Avoid `any`. Add custom types/interfaces for complex structures.
- Naming: Classes `PascalCase`; variables/functions/methods `camelCase`; files/directories
  `kebab-case` (follow the existing repo style if it differs); constants/env `UPPERCASE`.
- Methods are action-oriented `camelCase` verbs (`clickX`, `checkX`, `getX`, `selectX`,
  `verifyX`).
- Use `import type` when an import is only used as a type.
- Prefer arrow functions for simple operations; use default params and object destructuring.
- Add JSDoc to helper functions and reusable logic to describe intent (not line-by-line
  narration). Do not leave commentary on the resulting test code.

## Project Architecture (overrides generic rules)

- Tests import `{ test }` ONLY from `config/baseConfigFixtures` — never from
  `@playwright/test`.
- Credentials come ONLY from `data/users.ts` (`users.sport_username`,
  `users.sport_user_password`).
- New Georgian UI strings go in `data/texts.ts`; assertion messages in
  `data/errorMessages.ts`; URLs in the project's URL data file.
- Register every new Page Object in `config/baseConfigFixtures.ts`.
- Handle `element_state` (`requires_scroll` / `requires_hover`) inside the page method
  (`scrollIntoViewIfNeeded`, `hover` before action).
- Global configuration and cross-browser/device projects live in `playwright.config.ts`
  and `devices`; do not reconfigure per-test.

Follow the guidance at https://playwright.dev/docs/writing-tests.
