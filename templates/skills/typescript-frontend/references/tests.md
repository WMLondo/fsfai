# Tests

## What to test

- Test the **behavior** the user sees, not implementation details.
- Prioritize business logic, pure functions and interactive components.
- Do not test the framework or third-party libraries.

## How to describe tests

- `describe` with the name of the unit under test.
- `it('should …')` describing the expected behavior.

```ts
describe('formatCurrency', () => {
  it('should format a positive amount with two decimals', () => {
    expect(formatCurrency(10)).toBe('10,00 €');
  });

  it('should return an empty string when amount is undefined', () => {
    expect(formatCurrency(undefined)).toBe('');
  });
});
```

## Structure

- A test follows *Arrange → Act → Assert*.
- One behavior per test. If the name needs "and", it is two tests.
- Tests do not depend on each other or on their order.

## Components

- Use Testing Library (`@testing-library/react` or `@testing-library/react-native`).
- Query elements the way the user would: by role, text or label. `testID`/`data-testid` as a last resort.
- Simulate interactions with `userEvent` (web) or `fireEvent` (native).

## Location

- The test goes next to the file it tests: `OrderItem.tsx` → `OrderItem.test.tsx`.

## Snapshots

Avoid them as the main test: they get approved without being looked at and break on any change. Use them only for small,
stable outputs.
