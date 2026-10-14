# Related assets and file downloads

```sh
node scripts/client.mjs list --type memo_asset
node scripts/client.mjs get --id demo-memo-asset
```

Sample IDs are for the local demonstration only; actual workflows must use IDs returned by the service. Read details and confirm the fileId before downloading:

```sh
node scripts/client.mjs download --file-id demo-attachment --output sample-outline.txt
```

Do not derive fileId from assetId. Choose the output filename based on the actual MIME type and user request. The client calls `/files/get_download_url` for a short-lived link and streams the file. Download requests do not include the API Key. The client rejects redirects and existing output files, with a current limit of 100 MiB. Choose a new filename when the destination already exists.

Links expire and grant access to authorized material; do not expose them in replies or logs. Request a fresh link after expiry. See [api.md](api.md) for details. If the environment cannot inspect a file format, state the limitation and report known metadata rather than inventing content from its name. Download only files needed for the user's task.
