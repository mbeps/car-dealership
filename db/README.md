# TypeORM Database Layer

This directory contains the TypeORM implementation for database operations, working alongside the existing Supabase SDK.

## Architecture

### Hybrid Approach

The application uses **both TypeORM and Supabase SDK** strategically:

- **TypeORM**: Admin operations, complex queries, transactions
- **Supabase SDK**: User-facing operations that leverage Row Level Security (RLS)

### Why This Approach?

1. **TypeORM for Admin Operations**: Admin queries bypass RLS anyway (using service role), so TypeORM provides better type safety, query building, and ORM features.

2. **Supabase SDK for User Operations**: User-facing queries (car listings, saved cars, test drives) rely on Supabase's RLS policies for security. These stay with the Supabase SDK.

3. **Best of Both Worlds**: Complex admin queries get TypeORM's power, while user security remains enforced by Supabase's RLS.

## Directory Structure

```
db/
├── entities/           # TypeORM entity definitions
│   ├── user.entity.ts
│   ├── car.entity.ts
│   ├── car-make.entity.ts
│   ├── car-color.entity.ts
│   ├── dealership-info.entity.ts
│   ├── working-hour.entity.ts
│   ├── user-saved-car.entity.ts
│   ├── test-drive-booking.entity.ts
│   └── index.ts
├── services/          # Business logic layer
│   ├── admin-car.service.ts
│   ├── admin-test-drive.service.ts
│   ├── admin-settings.service.ts
│   └── index.ts
├── data-source.ts     # TypeORM DataSource configuration
├── repositories.ts    # Repository helper functions
├── utils.ts          # Utility functions (serialization, ID generation)
└── index.ts          # Main exports
```

## Environment Variables

```env
# Use direct connection for TypeORM (bypasses PgBouncer)
DIRECT_URL=postgresql://postgres.xxx:password@host:5432/postgres

# Pooled connection for Supabase SDK
DATABASE_URL=postgresql://postgres.xxx:password@host:6543/postgres?pgbouncer=true
```

## Usage Examples

### Using TypeORM Services (Admin Operations)

```typescript
import { AdminCarService } from "@/db/services";

// Search cars with TypeORM
const cars = await AdminCarService.searchCars("BMW");

// Create a new car
await AdminCarService.createCar({
  id: generateId(),
  carMakeId: "make-123",
  carColorId: "color-456",
  model: "M3",
  year: 2023,
  price: 50000,
  // ... other fields
});

// Update car status
await AdminCarService.updateCarStatus(carId, CarStatusEnum.SOLD);
```

### Using Supabase SDK (User Operations)

```typescript
import { createClient } from "@/lib/supabase";

// User-facing queries still use Supabase for RLS
const supabase = await createClient();
const { data } = await supabase
  .from("Car")
  .select("*, carMake(*), carColor(*)")
  .eq("status", "AVAILABLE");
```

## Key Features

### Entities

- **Decorators Enabled**: Uses TypeScript experimental decorators
- **Type Safety**: Full TypeScript typing for all entities
- **Unidirectional Relations**: Uses `@ManyToOne` only to avoid circular dependency issues during Next.js bundling
- **Transformers**: Numeric fields automatically converted from string (Supabase quirk)

**Note on Relations**: We intentionally omit `@OneToMany` decorators to prevent circular imports that break Next.js builds. To fetch reverse relations (e.g., all cars for a make, all saved cars for a user), use repository queries:

```typescript
// Example: Get all cars for a specific make
const carRepository = await getCarRepository();
const cars = await carRepository.find({
  where: { carMakeId: makeId }
});

// Example: Get all saved cars for a user
const savedCarsRepository = await getUserSavedCarRepository();
const savedCars = await savedCarsRepository.find({
  where: { userId },
  relations: ['car', 'car.make', 'car.color']
});
```

### Services

Services encapsulate business logic and provide:

- **Clean APIs**: Simple function calls instead of query building
- **Error Handling**: Consistent error responses
- **Type Safety**: Full typing for inputs and outputs
- **Reusability**: Shared logic across actions

### Data Source

- **Singleton Pattern**: Single connection pool across the app
- **Next.js Optimized**: Handles dev mode hot reloading
- **SSL Support**: Configures SSL for production Supabase connections

## Migration Guide

### Entities Match SQL Schema

All entities in `db/entities/` directly correspond to tables in `database/001_schema.sql`:

- Table names, column names, and types are identical
- Indexes are defined using `@Index()` decorators
- Enums reference the PostgreSQL enum types

### Functions, Triggers, and Policies Stay in SQL

TypeORM handles **schema only**. The following remain in SQL files:

- `database/010_functions.sql` - PL/pgSQL functions and triggers
- `database/020_policies.sql` - RLS policies
- `database/030_storage.sql` - Storage bucket policies

This ensures Supabase-specific features (auth.uid(), RLS, storage) work correctly.

## Important Notes

### TypeORM Does Not Replace Supabase SDK

- Keep using Supabase SDK for **any user-facing operation**
- Use TypeORM for **admin operations that already bypass RLS**
- Never expose TypeORM queries to client components (they use service role)

### Decorators

The project uses TypeScript decorators (`experimentalDecorators: true` in tsconfig). Entity relationships are unidirectional (`@ManyToOne` only) to prevent circular dependency issues during Next.js bundling.

### Serialization

Both Supabase and TypeORM entities flow through `serializeCarData()` helper which:

- Converts numeric strings to numbers
- Handles Date to ISO string conversion
- Flattens relations for client consumption

## Testing

Always test migrations thoroughly:

```bash
# Run dev server
yarn dev

# Check TypeScript compilation
yarn build

# Lint check
yarn lint
```

## Future Enhancements

- **Migrations**: Could add TypeORM migration generation for schema changes
- **Transactions**: Complex multi-table operations could use TypeORM transactions
- **Query Builder**: More complex filtering could leverage QueryBuilder
- **Caching**: TypeORM supports query caching for frequently accessed data
