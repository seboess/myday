# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence. Without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

- **Vitest** v4 with jsdom environment
- **@testing-library/react** for component tests
- **@testing-library/jest-dom** for DOM assertions

## Running Tests

```bash
npm test          # run all tests once
npx vitest        # watch mode
npx vitest run    # CI mode (no watch)
```

## Test Directory

```
test/
  setup.ts              # global test setup (jest-dom matchers)
  store-helpers.test.ts  # unit tests for grade calculation utils
```

## Conventions

- Test files live in `test/` with `.test.ts` or `.test.tsx` suffix
- Use `describe` / `it` blocks
- Import from `@/lib/...` using the path alias
- Pure functions: test directly with unit tests
- Components with Supabase deps: mock `@/lib/supabase` or extract pure logic

## Test Expectations

- When writing new functions, write a corresponding test
- When fixing a bug, write a regression test
- When adding error handling, write a test that triggers the error
- When adding a conditional (if/else, switch), write tests for BOTH paths
- Never commit code that makes existing tests fail
