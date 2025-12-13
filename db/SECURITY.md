# Database Security Guidelines

## Connection Security

### TypeORM Connection Requirements

**CRITICAL**: The `DIRECT_URL` environment variable **MUST** use Supabase service role credentials, not regular user credentials.

#### Why This Matters

TypeORM operations bypass Row Level Security (RLS) policies and are used exclusively for admin operations. Using regular user credentials would:
- Cause queries to fail due to RLS restrictions
- Create security vulnerabilities if accidentally used for user-facing operations
- Result in inconsistent behavior

#### Required Configuration

```env
# ✅ CORRECT: Service role connection (port 5432)
DIRECT_URL=postgresql://postgres.xxx:[SERVICE_ROLE_PASSWORD]@aws-x-xx-xxxx-x.pooler.supabase.com:5432/postgres

# ❌ WRONG: Regular user connection
DIRECT_URL=postgresql://postgres.xxx:[USER_PASSWORD]@aws-x-xx-xxxx-x.pooler.supabase.com:5432/postgres
```

#### How to Get Service Role Credentials

1. Go to Supabase Dashboard
2. Navigate to Project Settings → Database
3. Use the connection string under "Direct connection" section
4. Ensure you're using the password associated with the `postgres` role (service role)

### Connection String Ports

| Port | Purpose                    | Used By                       | Connection Type    |
| ---- | -------------------------- | ----------------------------- | ------------------ |
| 5432 | Direct database connection | TypeORM (`DIRECT_URL`)        | Bypasses PgBouncer |
| 6543 | Pooled connection          | Supabase SDK (`DATABASE_URL`) | Through PgBouncer  |

**Important**: TypeORM requires port 5432 to support:
- Prepared statements
- Complex transactions
- Migration operations
- Full PostgreSQL feature set

## Input Validation

All database service methods validate inputs using Zod schemas before executing queries.

### Validation Layers

1. **Action Layer**: Basic Zod validation in server actions
2. **Service Layer**: Additional validation in `db/validation.ts` 
3. **Database Layer**: PostgreSQL constraints and RLS policies

### Protected Against

- ✅ SQL Injection (TypeORM parameterized queries + validation)
- ✅ DoS via long search queries (max 200 characters)
- ✅ Invalid enum values (strict enum validation)
- ✅ Invalid UUIDs/IDs (format validation)
- ✅ Negative prices/mileage (range validation)
- ✅ Future years (reasonable date ranges)

### Validation Examples

```typescript
// Search queries
validateSearchParams(search); // Max 200 chars, trimmed

// IDs
validateId(carId); // Non-empty, max 255 chars
uuidSchema.parse(authId); // Strict UUID format

// Enums
validateCarStatus(status); // Only valid CarStatusEnum values
validateUserRole(role); // Only valid UserRoleEnum values
```

## Access Control

### TypeORM Services (Admin Only)

All services in `db/services/` should **ONLY** be called from:
- Admin server actions (in `actions/` that verify `isAdmin()`)
- Admin dashboard pages
- Backend jobs with elevated privileges

**Never** call these services from:
- User-facing pages
- Public API routes
- Client-side code

### Supabase SDK (User-Facing)

User operations use Supabase SDK which:
- Enforces Row Level Security policies
- Respects `auth.uid()` in policies
- Requires authenticated sessions
- Automatically filters based on user permissions

## RLS Policy Summary

| Table            | Public Read      | User Insert/Update | Admin Full Access |
| ---------------- | ---------------- | ------------------ | ----------------- |
| Car              | ✅ Yes            | ❌ No               | ✅ Yes             |
| CarMake          | ✅ Yes            | ❌ No               | ✅ Yes             |
| CarColor         | ✅ Yes            | ❌ No               | ✅ Yes             |
| User             | Own record only  | Own record only    | ✅ Yes             |
| UserSavedCar     | Own records only | Own records only   | ✅ Yes             |
| TestDriveBooking | Own records only | Own records only   | ✅ Yes             |
| DealershipInfo   | ✅ Yes            | ❌ No               | ✅ Yes             |
| WorkingHour      | ✅ Yes            | ❌ No               | ✅ Yes             |

## Best Practices

### DO ✅

- Use TypeORM services for admin operations
- Use Supabase SDK for user-facing queries
- Validate all inputs before database calls
- Check `isAdmin()` before calling admin services
- Use transactions for multi-step operations
- Keep service role credentials in secure environment variables
- Log failed validation attempts for security monitoring

### DON'T ❌

- Expose TypeORM services to client-side code
- Use DIRECT_URL in client-side code
- Skip input validation "for performance"
- Mix TypeORM and Supabase SDK in the same operation
- Hardcode service role credentials
- Use TypeORM for user-authenticated operations

## Security Checklist

Before deploying:

- [ ] `DIRECT_URL` uses service role credentials
- [ ] `DIRECT_URL` is not exposed in client bundles
- [ ] All admin actions call `isAdmin()` before service methods
- [ ] Input validation is present in all service methods
- [ ] RLS policies are enabled on all tables
- [ ] `public.is_admin()` function works correctly
- [ ] No TypeORM imports in client components
- [ ] Environment variables are in `.env` (gitignored)

## Monitoring

Consider adding:
- Connection pool metrics
- Failed validation attempt logging
- Slow query logging
- Admin operation audit logs

## Emergency Response

If service role credentials are compromised:

1. Immediately rotate credentials in Supabase Dashboard
2. Update `DIRECT_URL` in all environments
3. Restart all application instances
4. Review audit logs for unauthorized access
5. Check for unexpected data modifications

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [TypeORM Security](https://typeorm.io/security)
- [Database Policies](../database/020_policies.sql)
- [Input Validation](./validation.ts)
