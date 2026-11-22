# Functions

## Principles

- Pure whenever possible: the same input gives the same output and there are no side effects.
- Stateless and with a single responsibility.
- Small. If you need a comment to separate parts, split them into functions.
- Do not mutate arguments (see `types.md` → immutability).

## A single object as argument

If a function takes more than one argument, pass it an object. It reads better at the call site, order does not matter,
and it can be extended without breaking existing calls.

```ts
// ❌
transformUserInput('client', false, 60, 120, null, true, 2000);

// ✅
transformUserInput({
  method: 'client',
  isValidated: false,
  minLines: 60,
  maxLines: 120,
  defaultInput: null,
  shouldLog: true,
  timeout: 2000,
});
```

Exception: functions with one obvious argument (`formatDate(date)`) or callbacks whose signature is fixed by an API.

## Required and optional arguments

- Most arguments should be required.
- Optional ones get a default value in the destructuring.
- If optional arguments depend on each other, use a discriminated union.

```ts
type FetchUsersArgs = { page: number; pageSize?: number };

const fetchUsers = ({ page, pageSize = 20 }: FetchUsersArgs) => {
  // …
};
```

## Return types

- Declare the return type on exported functions and on those returning unions or promises: it documents intent and
  the error shows up in the function, not in its callers.
- For small local functions, inference is fine.

```ts
export const getUserStatus = (user: User): UserStatus => {
  // …
};
```

## Arrow functions

Use arrow functions (`const fn = () => {}`) for consistency, except when `function` is needed (e.g. overloads or
generics in `.tsx` files that confuse the parser).
