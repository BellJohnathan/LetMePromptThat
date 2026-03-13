# Cloudflare Configuration: Non-WWW Canonical Domain

## Problem

The `www.letmeprompthat.com` domain is not properly redirecting to the canonical
non-www version (`letmeprompthat.com`). The non-www domain should be the primary
setup in Cloudflare.

## Configuration Steps

Execute these via Cloudflare MCP tools or the Cloudflare dashboard.

### Step 1: Look up the zone ID

**Cloudflare MCP tool**: `zones_list` or `dns_records_list`
**Equivalent API**:
```
GET https://api.cloudflare.com/client/v4/zones?name=letmeprompthat.com
```
Note the `zone_id` from the response — it's needed for all subsequent calls.

### Step 2: Verify/create DNS record for root domain

**Cloudflare MCP tool**: `dns_records_list`
```json
{
  "zone_id": "<ZONE_ID>",
  "type": "CNAME",
  "name": "letmeprompthat.com"
}
```
Ensure a proxied CNAME record exists pointing to the Cloudflare Pages deployment
(e.g., `<project>.pages.dev`). If missing, create it:

**Cloudflare MCP tool**: `dns_records_create`
```json
{
  "zone_id": "<ZONE_ID>",
  "type": "CNAME",
  "name": "@",
  "content": "<project-name>.pages.dev",
  "proxied": true,
  "ttl": 1
}
```

### Step 3: Add DNS record for `www` subdomain

**Cloudflare MCP tool**: `dns_records_create`
```json
{
  "zone_id": "<ZONE_ID>",
  "type": "CNAME",
  "name": "www",
  "content": "letmeprompthat.com",
  "proxied": true,
  "ttl": 1
}
```

### Step 4: Create redirect rule (www → non-www)

**Cloudflare MCP tool**: `rules_create` (Redirect Rules / Single Redirects)
**Equivalent API**:
```
POST https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/rulesets/phases/http_request_dynamic_redirect/entrypoint
```
**Request body**:
```json
{
  "rules": [
    {
      "expression": "(http.host eq \"www.letmeprompthat.com\")",
      "description": "Redirect www to non-www (canonical)",
      "action": "redirect",
      "action_parameters": {
        "from_value": {
          "status_code": 301,
          "target_url": {
            "expression": "concat(\"https://letmeprompthat.com\", http.request.uri.path)"
          },
          "preserve_query_string": true
        }
      }
    }
  ]
}
```

### Step 5 (Optional): Repeat for `lmpt.io`

If `lmpt.io` also has www issues, apply the same DNS + redirect pattern for that zone.

## Verification

- `www.letmeprompthat.com` → 301 redirect → `letmeprompthat.com`
- `www.letmeprompthat.com/anything?q=1` → 301 redirect → `letmeprompthat.com/anything?q=1`
- `letmeprompthat.com` loads normally (no redirect loop)

## Result

This ensures:
- The non-www domain is canonical for SEO and consistency
- All www traffic is permanently redirected (301) to the non-www version
- Query strings and paths are preserved during redirect
