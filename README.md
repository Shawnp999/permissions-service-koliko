# Permissions Service

A microservice for managing API key permissions using NATS RPC and PostgreSQL.

## Quick Start

1. **Start the services**
   ```bash
   docker-compose up -d
   ```

2. **Create NATS KV bucket** (one time only)
   ```bash
   docker run --rm --network permissions-service-koliko_default nats:2 nats kv add permissions_cache --server=nats://nats:4222
   ```

3. **Test the service**
   ```bash
   node test.js
   ```

## What it does

The service provides 4 operations:
- **Grant** - Give permission to an API key
- **Check** - Verify if API key has permission
- **List** - Get all permissions for an API key
- **Revoke** - Remove permission from API key

## Example Usage

```javascript

nats.request('permissions.grant', {
  "apiKey": "abc-123",
  "module": "trades", 
  "action": "create"
})

nats.request('permissions.check', {
  "apiKey": "abc-123",
  "module": "trades",
  "action": "create" 
})
```

## Development

- **Rebuild service**: `docker-compose up --build -d permissions-service`
- **View logs**: `docker-compose logs -f permissions-service`
- **Stop everything**: `docker-compose down`

