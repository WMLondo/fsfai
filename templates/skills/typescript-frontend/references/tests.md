# Tests

## Qué probar

- Prueba el **comportamiento** que ve el usuario, no los detalles de implementación.
- Prioriza lógica de negocio, funciones puras y componentes con interacción.
- No pruebes el framework ni librerías de terceros.

## Cómo describir los tests

- `describe` con el nombre de la unidad que se prueba.
- `it('should …')` describiendo el comportamiento esperado.

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

## Estructura

- Un test se organiza en *Arrange → Act → Assert*.
- Un comportamiento por test. Si el nombre necesita "y", son dos tests.
- Los tests no dependen unos de otros ni del orden.

## Componentes

- Usa Testing Library (`@testing-library/react` o `@testing-library/react-native`).
- Busca elementos como lo haría el usuario: por rol, texto o label. `testID`/`data-testid` como último recurso.
- Simula interacciones con `userEvent` (web) o `fireEvent` (native).

## Ubicación

- El test va junto al archivo que prueba: `OrderItem.tsx` → `OrderItem.test.tsx`.

## Snapshots

Evítalos como test principal: se aprueban sin mirarlos y se rompen con cualquier cambio. Úsalos solo para salidas pequeñas
y estables.
