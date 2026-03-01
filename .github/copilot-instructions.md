# Copilot Instructions

This document contains important guidelines for AI assistants working on this project.

## Frontend Build Requirements

**CRITICAL**: After making ANY changes to Svelte components (`.svelte` files), you MUST build the frontend:

```bash
cd src/dashboard
npm run build
```

This includes changes to:
- UI pages (`src/routes/**/*.svelte`)
- Components (`src/components/**/*.svelte`)
- Layouts (`src/routes/**/+layout.svelte`)
- CSS or styling changes

The frontend build compiles the SvelteKit application into production assets. Without building, changes made to `.svelte` files will not be reflected in the actual application.

## Database Migrations

All database schema changes should:
1. Update the three schema files in parallel:
   - `db/postgresql/schema.prisma`
   - `db/mysql/schema.prisma`
   - `db/sqlite/schema.prisma`

2. Create migration files for all three database providers:
   - `db/postgresql/migrations/{timestamp}_description/migration.sql`
   - `db/mysql/migrations/{timestamp}_description/migration.sql`
   - `db/sqlite/migrations/{timestamp}_description/migration.sql`

Migrations run automatically at bot startup without manual intervention.

## Code Organization

- API endpoints: `src/routes/api/**/*.js`
- Frontend pages: `src/dashboard/src/routes/**/*.svelte`
- Components: `src/dashboard/src/components/**/*.svelte`
- Database schemas: `db/{provider}/schema.prisma`
- Utilities: `src/lib/**/*.js`

## Testing

After making changes:
- Test the functionality locally if possible
- Verify no console errors or warnings
- Check responsive design on mobile and desktop

## Git Workflow

- Keep commits focused and well-described
- Follow existing commit message conventions
- Don't force-push to main without explicit user request
