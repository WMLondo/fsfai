# Funciones

## Principios

- Puras siempre que se pueda: la misma entrada da la misma salida y no hay efectos secundarios.
- Sin estado y con una sola responsabilidad.
- Pequeñas. Si necesitas un comentario para separar partes, sepáralas en funciones.
- No mutes los argumentos (ver `types.md` → inmutabilidad).

## Un solo objeto como argumento

Si una función recibe más de un argumento, pásale un objeto. Es más legible en la llamada, el orden no importa y se
puede extender sin romper llamadas existentes.

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

Excepción: funciones de un argumento evidente (`formatDate(date)`) o callbacks con firma fijada por una API.

## Argumentos obligatorios y opcionales

- La mayoría de argumentos deben ser obligatorios.
- Los opcionales, con valor por defecto en la desestructuración.
- Si los argumentos opcionales dependen unos de otros, usa una unión discriminada.

```ts
type FetchUsersArgs = { page: number; pageSize?: number };

const fetchUsers = ({ page, pageSize = 20 }: FetchUsersArgs) => {
  // …
};
```

## Tipos de retorno

- Declara el tipo de retorno en funciones exportadas y en las que devuelven uniones o promesas: documenta la intención y
  el error aparece en la función, no en quien la usa.
- En funciones locales y pequeñas, la inferencia está bien.

```ts
export const getUserStatus = (user: User): UserStatus => {
  // …
};
```

## Funciones flecha

Usa funciones flecha (`const fn = () => {}`) por consistencia, salvo cuando haga falta `function` (p. ej. sobrecargas o
genéricos en archivos `.tsx` que confunden al parser).
