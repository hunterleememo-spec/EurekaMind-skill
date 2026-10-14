# Recordings

```sh
node scripts/client.mjs list --type recording
node scripts/client.mjs get --id demo-recording
```

`demo-recording` is a local fixture ID. For actual requests, use IDs returned by listing or search. Details provide content, status, `relatedIds`, and an optional `fileId`. Read related asset details as needed to establish their types, then follow the [transcript](transcripts.md) or [note](notes.md) workflow.

Recording IDs, transcript asset IDs, and file IDs are not interchangeable. Download audio only when the task needs it, using the fileId returned in the details and the [file guide](assets.md). If the environment cannot play or process audio, explain that limitation and use an existing transcript if available. A title or summary is not evidence that you listened to the recording.

The current sample audio is a synthetic tone. The sample transcript is not a transcription of that tone. Cite the actual title and asset ID; do not invent a sharing URL when none is returned.
