# Auth API Flow

Base path: `/api`

## 1) Register

`POST /auth/register`

Request:

```json
{
  "name": "Ali Khan",
  "email": "ali@example.com",
  "password": "StrongPass123!"
}
```

Success response (`201`):

```json
{
  "user": {
    "id": "uuid",
    "name": "Ali Khan",
    "email": "ali@example.com",
    "plan": "free",
    "storeId": "uuid"
  },
  "token": "jwt_access_token",
  "refreshToken": "opaque_refresh_token"
}
```

## 2) Login

`POST /auth/login`

Request:

```json
{
  "email": "ali@example.com",
  "password": "StrongPass123!"
}
```

Success response (`200`): same shape as register.

## 3) Admin Login

`POST /auth/admin/login`

Same request as login.  
Returns `403` if user is not admin.

## 4) Current User (Protected)

`GET /auth/me`

Header:

```http
Authorization: Bearer <token>
```

Success response (`200`):

```json
{
  "user": {
    "id": "uuid",
    "name": "Ali Khan",
    "email": "ali@example.com",
    "plan": "free",
    "isActive": true,
    "storeId": "uuid"
  }
}
```

## 5) Refresh Access Token

`POST /auth/refresh`

Request:

```json
{
  "refreshToken": "opaque_refresh_token"
}
```

Success response (`200`):

```json
{
  "token": "new_jwt_access_token",
  "refreshToken": "new_opaque_refresh_token",
  "user": {
    "id": "uuid",
    "name": "Ali Khan",
    "email": "ali@example.com",
    "plan": "free",
    "storeId": "uuid"
  }
}
```

Notes:
- Refresh token is rotated (old one is revoked).
- Store refresh token securely (httpOnly cookie recommended in production).

## 6) Forgot Password

`POST /auth/password/forgot`

Request:

```json
{
  "email": "ali@example.com"
}
```

Success response (`200`):

```json
{
  "ok": true,
  "resetToken": "token_for_dev_only"
}
```

Note:
- Current implementation returns reset token in response for development/testing.
- In production, send this token via email/SMS provider and do not expose it in API response.

## 7) Reset Password

`POST /auth/password/reset`

Request:

```json
{
  "token": "reset_token_from_forgot_password",
  "newPassword": "NewStrongPass123!"
}
```

Success response (`200`):

```json
{
  "ok": true
}
```

## Error format

Typical error response:

```json
{
  "error": "message"
}
```

Validation errors return `400` with Zod flatten payload.

## Env variables required

- `DATABASE_URL`
- `JWT_SECRET`
- `SEED_ADMIN_NAME` (optional)
- `SEED_ADMIN_EMAIL` (required for seed)
- `SEED_ADMIN_PASSWORD` (required for seed)

## Seed first admin

Run:

```bash
pnpm --filter @workspace/api-server run seed:admin
```

