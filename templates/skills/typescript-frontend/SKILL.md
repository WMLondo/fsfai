---
name: typescript-frontend
description: Úsala SIEMPRE que leas, escribas o revises código de frontend o mobile (Next.js, Expo, React): componentes, hooks, tipos, formularios, data fetching o tests.
---

# TypeScript frontend/mobile — guía de estilo

Apps: {{frontendAppPaths}}. Gestor de paquetes: **{{packageManager}}**.

Adaptación del [TypeScript Style Guide](https://mkosir.github.io/typescript-style-guide/) de mkosir.
Lint con **Oxlint** y formato con **Oxfmt** desde la raíz (`{{packageManager}} run lint`, `{{packageManager}} run format`).
No añadas ESLint ni Prettier.

## TLDR

- Usa `as const` para constantes: más seguridad de tipos e inmutabilidad.
- Prefiere datos inmutables: `Readonly`, `ReadonlyArray`.
- La mayoría de propiedades deben ser obligatorias. Las opcionales, con moderación.
- Usa uniones discriminadas para modelar estados y variantes.
- Evita las aserciones de tipo (`as`, `!`). Define bien los tipos.
- Funciones puras, sin estado y con una sola responsabilidad.
- Nombres consistentes y legibles en todo el código.
- Solo exports con nombre. Sin `export default` (salvo archivos de ruta y configuración que lo exigen).
- Organiza el código por funcionalidad y coloca juntos los módulos relacionados.
- `type` en lugar de `interface` y `Array<T>` en lugar de `T[]`.

## Qué referencia cargar

Lee solo la referencia que necesita la tarea:

| Tarea | Referencia |
| --- | --- |
| Definir o revisar tipos, `any`/`unknown`, aserciones, `type` vs `interface`, arrays, imports de tipos | `references/types.md` |
| Modelar estados, variantes, respuestas de API o props excluyentes | `references/discriminated-unions.md` |
| Escribir funciones: argumentos, opcionales, tipos de retorno, pureza | `references/functions.md` |
| Constantes, `as const`, enums, `null`/`undefined` | `references/variables.md` |
| Nombrar variables, funciones, tipos, genéricos, componentes, hooks, props, handlers; comentarios | `references/naming.md` |
| Dónde poner un archivo, estructura de carpetas, imports | `references/source-organization.md` |
| Componentes, props, hooks y estado en React / React Native | `references/react.md` |
| Escribir o revisar tests | `references/tests.md` |
