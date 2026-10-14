# Notes

```sh
node scripts/client.mjs search --query 'product' --type note
node scripts/client.mjs get --id demo-note
```

Read the full content using the ID returned in a match before summarizing conclusions, decisions, or action items. A list title or search snippet is insufficient. Use `sourceId` and `relatedIds` to find related recordings, ideas, or transcripts; see [api.md](api.md) for field semantics.

Report owners, deadlines, and decisions as facts only when explicitly present in the source. Label additional interpretations or recommendations accordingly. Cite the actual title and ID, and state when source content is unavailable, processing, or inaccessible.

This Skill reads notes; it cannot create or edit them or mark action items complete.
