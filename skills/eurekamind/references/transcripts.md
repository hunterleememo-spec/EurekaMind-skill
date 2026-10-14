# Transcripts

Find an asset of type `transcript` in search results or a recording's related assets, then read it:

```sh
node scripts/client.mjs get --id demo-transcript
node scripts/client.mjs transcript --id demo-transcript --all
```

The second command calls `/transcripts/list`; `assetId` must identify a transcript asset. Segments contain `id`, `ordinal`, `speaker`, `startMs`, `endMs`, and `text`. Times are in milliseconds. Preserve segment order and display speakers and converted timestamps as relevant. Do not infer names for unidentified speakers.

A `processing` state or an empty segment list does not establish a completed empty transcript. Report the state and do not initiate generation through this read-only connection. Base summaries on the segments actually read, citing the transcript ID and relevant time ranges. State the coverage when traversal is incomplete. See [api.md](api.md) for pagination.
