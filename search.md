# Search and listing

Use this workflow for requests such as "find material about a topic" or "show last week's notes." Run examples from the Skill directory, or use the client's absolute path.

```sh
node scripts/client.mjs search --query 'product direction' --type note --limit 20
node scripts/client.mjs list --type recording --from 2026-10-01T00:00:00+08:00 --to 2026-10-07T23:59:59+08:00
```

Replace the sample topic and dates with the user's request. Time boundaries are inclusive and require ISO 8601 timestamps with a timezone. Search currently uses case-insensitive substring matching over titles and text, not semantic retrieval. No matches do not establish that the account contains no related ideas.

Types are `recording`, `transcript`, `note`, `memo_audio`, `memo_text`, and `memo_asset`. The CLI calls `/assets/search` and `/assets/list`, with JSON parameters inside `params`; see [api.md](api.md).

Present matching titles, types, IDs, and timestamps first. A list entry or snippet is not the full content; use `get --id <asset-id>` before summarizing. Add `--all` when the request needs the complete range or all matches. Otherwise follow `hasMore` and `nextCursor`, preserving query filters. Do not describe the first page as the entire collection.
