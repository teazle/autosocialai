# API Documentation

Complete API reference for AutoSocial AI.

## Base URL

```
Production: https://your-app.vercel.app
Development: http://localhost:3000
```

## Authentication

Most endpoints use Supabase service role authentication internally. No API key required for admin operations (protected by Next.js middleware).

---

## Admin Endpoints

### Create Client Invite

Generate an onboarding link for a new client.

```http
POST /api/admin/clients/invite
```

**Request Body:**
```json
{
  "name": "Client Name",
  "brand_voice": "Friendly",
  "timezone": "Asia/Singapore",
  "industry": "Fashion",
  "target_audience": "Young professionals, 25-35"
}
```

**Response:**
```json
{
  "clientId": "uuid",
  "onboardingToken": "hex-string",
  "onboardingLink": "https://your-app.com/onboard/{token}"
}
```

---

### Get All Clients

Fetch all clients with statistics.

```http
GET /api/admin/clients
```

**Response:**
```json
{
  "clients": [
    {
      "id": "uuid",
      "name": "Client Name",
      "status": "active",
      "brand_voice": "Friendly",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "stats": {
    "activeClients": 10,
    "postsThisWeek": 25,
    "successRate": 95
  }
}
```

---

### Get Client Content

Fetch content pipeline for a client.

```http
GET /api/admin/clients/[clientId]/content
```

**Response:**
```json
{
  "content": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "scheduled_at": "2024-01-15T10:00:00Z",
      "status": "pending",
      "hook": "Amazing product launch!",
      "caption_ig": "...",
      "image_url": "https://..."
    }
  ]
}
```

---

### Kill Switch

Toggle global auto-posting.

```http
GET /api/admin/killswitch
POST /api/admin/killswitch
```

**POST Request:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "enabled": true
}
```

---

## Client Endpoints

### Get Client

Fetch single client details.

```http
GET /api/clients/[clientId]
```

**Response:**
```json
{
  "client": {
    "id": "uuid",
    "name": "Client Name",
    "brand_voice": "Friendly",
    "timezone": "Asia/Singapore",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### Update Client

Update client information.

```http
PATCH /api/clients/[clientId]
```

**Request Body:**
```json
{
  "name": "New Name",
  "timezone": "America/New_York",
  "status": "paused"
}
```

**Response:**
```json
{
  "client": { ... }
}
```

---

### Delete Client

Remove client and all related data.

```http
DELETE /api/clients/[clientId]
```

**Response:**
```json
{
  "success": true
}
```

---

## Social Connections

### Get Connections

Fetch social accounts for a client.

```http
GET /api/clients/[clientId]/connections
```

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "platform": "facebook",
      "business_id": "12345",
      "page_id": "67890",
      "token_expires_at": "2024-12-31T23:59:59Z"
    }
  ]
}
```

---

### Save Connection

Store or update social account.

```http
POST /api/clients/[clientId]/connections
```

**Request Body:**
```json
{
  "platform": "facebook",
  "token": "encrypted-string",
  "refresh_token": "encrypted-string",
  "expires_at": "2024-12-31T23:59:59Z",
  "page_id": "67890",
  "business_id": "12345"
}
```

**Response:**
```json
{
  "account": { ... }
}
```

---

## Content Pipeline

### Get Pipeline

Fetch posts for a client.

```http
GET /api/clients/[clientId]/pipeline
```

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "scheduled_at": "2024-01-15T10:00:00Z",
      "status": "pending",
      "hook": "...",
      "caption_ig": "...",
      "caption_fb": "...",
      "caption_tt": "...",
      "image_url": "...",
      "post_refs": {},
      "error_log": null
    }
  ]
}
```

---

### Create Post

Add new post to pipeline.

```http
POST /api/clients/[clientId]/pipeline
```

**Request Body:**
```json
{
  "scheduled_at": "2024-01-15T10:00:00Z",
  "hook": "Amazing launch!",
  "caption_ig": "...",
  "caption_fb": "...",
  "caption_tt": "...",
  "image_url": "https://...",
  "status": "generated"
}
```

**Response:**
```json
{
  "post": { ... }
}
```

---

### Update Post

Update existing post.

```http
PATCH /api/pipeline/[postId]
```

**Request Body:**
```json
{
  "hook": "Updated hook",
  "caption_ig": "...",
  "status": "pending"
}
```

**Response:**
```json
{
  "post": { ... }
}
```

---

### Delete Post

Remove post from pipeline.

```http
DELETE /api/pipeline/[postId]
```

**Response:**
```json
{
  "success": true
}
```

---

### Publish Post

Publish post immediately to all platforms.

```http
POST /api/pipeline/[postId]/publish
```

**Response:**
```json
{
  "post": { ... },
  "success": true,
  "errors": []
}
```

**Errors:** Array of platform errors if any failed.

---

### Regenerate Content

Generate new AI content and image.

```http
POST /api/pipeline/[postId]/regenerate
```

**Response:**
```json
{
  "post": {
    "id": "uuid",
    "hook": "New hook...",
    "caption_ig": "...",
    "caption_fb": "...",
    "caption_tt": "...",
    "image_url": "https://..."
  }
}
```

---

## OAuth Endpoints

### Meta OAuth

Start Facebook/Instagram OAuth flow.

```http
GET /api/auth/meta?client_id={clientId}
```

Redirects to Meta OAuth consent screen.

---

### Meta Callback

Handle OAuth callback from Meta.

```http
GET /api/auth/meta/callback?code={code}&state={state}
```

Stores encrypted tokens in database.

---

### TikTok OAuth

Start TikTok OAuth flow.

```http
GET /api/auth/tiktok?client_id={clientId}
```

Redirects to TikTok OAuth consent screen.

---

### TikTok Callback

Handle OAuth callback from TikTok.

```http
GET /api/auth/tiktok/callback?code={code}&state={state}
```

Stores encrypted tokens in database.

---

## Error Responses

### Client Error (400)

```json
{
  "error": "Invalid request data"
}
```

### Authentication Error (403)

```json
{
  "error": "Access denied"
}
```

### Not Found (404)

```json
{
  "error": "Resource not found"
}
```

### Server Error (500)

```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- No rate limiting currently implemented
- Consider adding for production use

## Security

- All tokens encrypted with AES-256
- Service role key for database operations
- Environment variables for sensitive data
- HTTPS enforced in production

---

## Testing

### Using cURL

```bash
# Create client
curl -X POST http://localhost:3000/api/admin/clients/invite \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client"}'

# Get clients
curl http://localhost:3000/api/admin/clients

# Publish post
curl -X POST http://localhost:3000/api/pipeline/{postId}/publish
```

### Using Postman

1. Import collection (if available)
2. Set base URL
3. Send requests
4. Check responses

---

## Webhooks

Future feature:
- Post published webhooks
- Error notifications
- Token expiry alerts

---

## Support

For API issues:
- Check error responses
- Review logs
- Contact support

