# Quick audio and text ideas

```sh
node scripts/client.mjs list --type memo_audio
node scripts/client.mjs search --query 'idea' --type memo_text
```

- `memo_audio`: read details first. Use `fileId` when the original audio is needed, or read an existing related transcript asset. Do not automatically generate missing transcripts.
- `memo_text`: read the full text before extracting themes, preserving the original wording and source ID when relevant.
- `memo_asset`: see [assets.md](assets.md) for related images and files.

Audio, transcripts, text notes, and attachments are distinct assets. Matching titles alone do not establish that they belong to the same idea. Use `sourceId`, `relatedIds`, and retrieved details to establish relationships; list items separately when there is no supporting relationship. For batch summaries, follow the scope and pagination rules in [search.md](search.md).
