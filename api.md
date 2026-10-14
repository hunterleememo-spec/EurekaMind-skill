# EurekaMind read API version 1

Current implementation: local sample server on `http://127.0.0.1:9052`. This is not a production endpoint. The public GitHub repository and production hostname are not configured yet.

## Transport

Send JSON to `POST /api/agent/v1/gateway` with `Authorization: Bearer <read-only-key>` and `Content-Type: application/json`.

```json
{
  "protocol_version": "1",
  "skill_version": "0.1.0",
  "api_name": "/assets/list",
  "params": {"type": "note", "limit": 20}
}
```

Successful responses are `{ "code": 0, "message": "ok", "data": ... }`. Errors have a nonzero string code and an appropriate HTTP status. An HTTP 200 alone is insufficient: inspect `code`.

Never submit userId. The authenticated Key determines the owner for every lookup. Unknown operations and unknown parameters are rejected. Requests are limited to 16 KiB, pages to 100 items, and the local server limits each Key to 120 gateway requests per minute. Keys expire after 30 days and can be revoked immediately.

## Operations

| api_name | params | data |
| --- | --- | --- |
| `/_list` | `{}` | Supported operations, asset types, scope, version and page limit |
| `/me` | `{}` | Authorized user ID, scope, dataSource |
| `/assets/list` | Optional type, query, from, to, limit, cursor | items, hasMore, nextCursor, dataSource |
| `/assets/search` | Required query; optional type, from, to, limit, cursor | Same pagination plus a snippet per match |
| `/assets/get` | Required assetId | Full content, processing status, sourceId, relatedIds, optional fileId |
| `/transcripts/list` | Required transcript assetId; optional limit, cursor | Ordered segments, hasMore, nextCursor, processing status |
| `/files/get_download_url` | Required fileId | url, fileName, mimeType, size in bytes, expiresAt, dataSource |

Types: `recording`, `transcript`, `note`, `memo_audio`, `memo_text`, `memo_asset`.

`from` and `to` are inclusive ISO 8601 timestamps with timezone, for example `2026-10-12T00:00:00Z`. Search is case-insensitive substring matching over title and text, not semantic search. A list item contains metadata; fetch its detail before summarizing.

Asset IDs identify individual assets. sourceId relates a note or transcript to its parent recording/memo. To read segments, first discover the related `transcript` asset ID; a recording ID is not a transcript ID. Segment fields: id, ordinal, speaker, startMs, endMs, text.

## Pagination and files

Keep the same filters when following nextCursor. An empty nextCursor with hasMore=false ends traversal. The signed cursor is bound to the owner and query and expires after 15 minutes. The local database freezes the insertion sequence at the first page, so subsequent inserts are excluded. Existing items changing or being deleted during traversal are not a transactional snapshot; a production adapter must define its corresponding consistency contract.

Download links expire after 60 seconds. They need no Authorization header and must not receive one. The local download endpoint rechecks the issuing Key, so revocation invalidates even previously issued links. This property must be explicitly implemented if replacing it with cloud storage URLs. The CLI refuses redirects and overwrites and limits each download to 100 MiB. Larger production files require an extended streaming policy before release.

Statuses in local fixtures: `ready`, `processing`. Processing content can be null or have no segments. Do not treat an empty page for a processing transcript as a completed empty transcript. Synthetic WAV fixtures contain a tone; sample transcript text is not a transcription of the tone.

## Error codes

| HTTP | Code | Action |
| --- | --- | --- |
| 400 | INVALID_REQUEST | Correct parameters or restart an expired cursor query |
| 400 | VERSION_UNSUPPORTED | Use protocol version 1 |
| 401 | UNAUTHORIZED | Configure a valid, unexpired Key |
| 401 | LOGIN_REQUIRED | Open the account management page |
| 403 | OPERATION_DENIED | Only documented read operations are available |
| 403 | ORIGIN_DENIED / CSRF_DENIED / LOCAL_ONLY | Use the local page and same-origin management flow |
| 404 | NOT_FOUND | Missing or inaccessible resource; do not guess another owner's IDs |
| 409 | KEY_LIMIT | Legacy/manual issuance limit reached; use the website current-Key flow or revoke an old manual Key |
| 413 | BODY_TOO_LARGE | Keep requests under 16 KiB |
| 429 | RATE_LIMITED | Wait one minute before retrying |

## Browser management endpoints

Management uses an HttpOnly SameSite=Strict session cookie, not an API Key. Every management request needs `X-EurekaMind-Request: 1`; mutations use JSON. Cross-origin access is disabled.

- `POST /api/agent/v1/session/demo {}` opens the explicitly labeled sample account. This is not real account authentication.
- `GET /api/agent/v1/session` reads sample session state.
- `POST /api/agent/v1/session/logout {}` ends that session; existing API Keys remain valid until revoked or expired.
- `GET /api/agent/v1/keys` lists masked metadata only.
- `POST /api/agent/v1/keys/current {}` retrieves the account’s current website Key, creating one automatically if absent, revoked or expired. Returns `id`, `key`, `scope`, `createdAt`, `expiresAt`, nullable `lastUsedAt`. The page calls this after sign-in and when restoring an existing session. Concurrent calls return the same Key. Responses are `no-store`; plaintext is not persisted in browser storage.
- `POST /api/agent/v1/keys/current/reset {"keyId":"<current id>"}` atomically revokes that website Key and supplies a replacement. A stale or foreign ID returns `409 KEY_CHANGED`; it cannot revoke a later replacement. Configure the client with the new Key.
- `POST /api/agent/v1/keys {}` remains a legacy/manual endpoint; only its creation response exposes that manually issued Key. It is no longer part of the website flow. Legacy Keys are not revoked during migration.
- `POST /api/agent/v1/keys/{id}/revoke {}` revokes an owned Key.
- `POST /api/agent/v1/keys/{id}/rotate {}` revokes it and creates a replacement atomically.

The sample server must remain bound to loopback. For real accounts, replace the demo session with the existing EurekaMind authenticated identity and install owner-aware data adapters in the private backend. Do not publish this local login endpoint.
