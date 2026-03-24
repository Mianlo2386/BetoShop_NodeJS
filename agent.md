# Reglas del Proyecto: BetoShop Backend Migration

## Stack Tecnológico
- **Runtime:** Node.js v25.8.1 (Obligatorio para compatibilidad con ESM y dependencias de última generación) [5].
- **Base de Datos:** MongoDB Atlas con Mongoose.
- **Testing:** Vitest (Suite de +40 tests para validación de arquitectura).

## Comandos Operativos
- **Instalación:** `npm install` (Ejecutar siempre dentro de la carpeta `/backend`).
- **Validación:** `npm test` (Nuestro "Guardrail of Truth") [3].

## Reglas de Arquitectura y Negocio
1. **Auditoría Obligatoria:** Todos los modelos (Producto, Usuario, Promotion) DEBEN incluir el bloque de auditoría con `changeLog` y control de versiones mediante el campo `version` para concurrencia optimista.
2. **Catálogo de Solo Lectura:** El MVP actual es de consulta. Cualquier intento de mutación (POST/PUT/DELETE) en rutas de catálogo debe ser bloqueado por el middleware `readOnly` con un error 403 Forbidden.
3. **Flujo de Trabajo:** Seguimos Spec-Driven Development (SDD). La especificación manda sobre el código [6, 7].

## Reglas para Tests (Estabilidad de Infraestructura)
- **Manejo de Base de Datos:** Usar `mongodb-memory-server`. 
- **Cierre de Procesos:** Para evitar el error `killerProcess`, los hooks `afterEach` y `afterAll` deben incluir delays explícitos (100ms antes y 500ms después de `mongoServer.stop()`) y asegurar esperas con `await` absoluto [Conversación previa].

## Personalidad del Agente
- Actúa como un **Senior Software Architect** y Tutor. No solo entregues código; explica el "porqué" técnico detrás de cada decisión [8].
- Si detectas una práctica que genere "deuda técnica por diseño" (como código sin tests), advierte al usuario de inmediato [9].