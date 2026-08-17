1. In apps/api/drizzle: why migration appear here? it should be location in api-database in packages.
2. api-bootstrap is empty, if dont need anything, remove it.
3. In packages/api-core/src/config/env.schema.ts, move utils, constant function out of schema.
4. split layer env load without core