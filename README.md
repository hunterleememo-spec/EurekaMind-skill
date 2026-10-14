# EurekaMind Skills

Read-only agent skills for EurekaMind recordings, transcripts, notes, Eureka ideas and other assets.

**Version 0.2.0 requires an explicitly configured service address.** There is no default localhost or production endpoint. Installing the Skill does not start a server, issue a Key, or connect a real account. The real Key service and data Gateway still require backend deployment and end-to-end verification.

## Installation

Requires Node.js 18+ and npm.

Install from GitHub:

```sh
npx --yes skills@1.7.2 add hunterleememo-spec/EurekaMind-skill -g -y
```

Alternatively, from a local checkout of this repository:

```sh
npx --yes skills@1.7.2 add . -g -y
```

You can also copy the entire `skills/eurekamind` directory into your agent's supported Skill directory. See the [skills installer documentation](https://github.com/vercel-labs/skills) for agent selection. Local CLI installation has been tested. End-to-end compatibility with Codex, Claude Code, Muse, and Grok Bot still needs separate verification. Your agent must be able to execute Node.js and reach the configured service.

## Configuration

1. Obtain the **verified HTTPS Gateway origin** and connection-page URL from your EurekaMind service owner. The connection page is normally `/skills`; it reuses the existing account login and returns to `/skills#setup`. The frontend page alone does not provide a working Gateway.
2. Sign in and copy the automatically provided read-only Key once the backend is available. If the page reports unavailable, ask the service owner to deploy the Key service. No manual create-Key step is needed.
3. Set `EUREKAMIND_API_BASE` to the verified origin. Locate the installed Skill's client and run the following in a terminal. Enter the Key at the hidden prompt:

```sh
# From a repository checkout; after installation use the installed script's actual path.
node skills/eurekamind/scripts/client.mjs configure --base-url "$EUREKAMIND_API_BASE"
node skills/eurekamind/scripts/client.mjs me
node skills/eurekamind/scripts/client.mjs capabilities
```

No address means a configuration error, never a localhost fallback. The client verifies `/me` and `assets:read` before saving credentials. Confirm the data source and supported operations before querying real content.

Credentials are saved to `~/.config/eurekamind/credentials.json` with mode 0600 and bound to the selected origin. A secret manager may supply `EUREKAMIND_API_KEY` and `EUREKAMIND_API_BASE` **together**. Do not put Keys in arguments, chat or Git. Reconfigure after a Key reset or service change.

The known pre-release host is `https://pre.card.biz`. Its Agent Key/Gateway integration is not verified by this release; it is not a default endpoint. Only use it after the service owner confirms deployment and issues a matching Key. HTTP 404/503 indicates a service or routing dependency; changing the Skill's address cannot deploy a missing backend.

### Updating from 0.1.0

Run the GitHub installation command again, then configure the verified service address and its corresponding Key. Old saved localhost configurations are blocked until you explicitly choose developer demo mode. An environment Key no longer inherits a saved service address.

### Optional developer demo

Only for an intentional sample-data test with a separately running loopback server:

```sh
node skills/eurekamind/scripts/client.mjs configure --base-url http://127.0.0.1:9052 --demo
```

The explicit demo choice is saved. `--demo` can also enable it for one command. Responses marked `dataSource: local-demo` are synthetic, not your personal content. The public distribution does not include the server. Cloud agents cannot assume they can reach your localhost. Demo mode is never an automatic fallback.

## Usage

After installation and configuration, ask your agent in natural language:

- "Find notes about product direction, summarize the conclusions, and cite the sources."
- "Read this recording's transcript and organize the key points by speaker."
- "Search my recent quick ideas for thoughts about interaction design."
- "Download the attachment associated with this idea."

## Capabilities

| Capability | Description | Guide |
| --- | --- | --- |
| Search and listing | Filter by type and time; paginate as needed | [search.md](skills/eurekamind/references/search.md) |
| Recordings | Read metadata and related transcripts, notes, and audio | [recordings.md](skills/eurekamind/references/recordings.md) |
| Transcripts | Read paginated speakers, timestamps, and text | [transcripts.md](skills/eurekamind/references/transcripts.md) |
| Notes | Read full content and sources; summarize decisions and action items | [notes.md](skills/eurekamind/references/notes.md) |
| Eureka | Search and read saved ideas in supported formats | [ideas.md](skills/eurekamind/references/ideas.md) |
| Other Assets | Inspect linked assets and download files as needed | [assets.md](skills/eurekamind/references/assets.md) |

Reminders appear on the connection page, but their backend contract is still pending. Check deployed capabilities; this release does not promise Reminder queries.

The API is read-only. The Key determines the account identity; do not submit userId. See [api.md](skills/eurekamind/references/api.md) for the full contract.

## Version and verification

Skill version: **0.2.0**. Protocol version: **1**. Every client request includes `skill_version` and `protocol_version`. See [CHANGELOG.md](CHANGELOG.md). Automatic upgrade notifications are not implemented.

Run distribution validation and client contract tests without a real account or backend:

```sh
node scripts/check-distribution.mjs
node --test tests/skill-contract.test.mjs
```

GitHub Actions is configured to run these checks on Node.js 18, 22, and 24. The checks have passed locally on Node.js 24; consult the Actions tab for hosted results. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## License and reference

Licensed under the [Apache License 2.0](LICENSE). Repository organization follows the installation entry point, Skill entry point, and functional documentation pattern of [Tencent/WeChatReading](https://github.com/Tencent/WeChatReading). EurekaMind code, documentation, and API contracts are maintained independently. This is not an official Tencent project.
