# EurekaMind Skills

Read-only agent skills for EurekaMind recordings, transcripts, notes, quick audio ideas, text ideas, and related assets.

**Version 0.1.0 is an integration preview.** The Skill and client are installable, but production authentication and data services are not connected yet. The currently available endpoint is a separately run local sample server. Installing the Skill does not start a server or authorize an account.

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

1. Open the connection page. The [local setup page](http://127.0.0.1:9052/#setup) requires the local development server to be running separately; this distribution does not include that server.
2. Sign in and copy the automatically provided read-only API Key. There is no separate creation step. Refreshing the page preserves the same active Key; resetting it requires updating the client configuration.
3. Ask your agent to locate the installed Skill's `scripts/client.mjs`. Run the following commands in a terminal and paste the Key at the hidden-input prompt:

```sh
# From the repository root; after installation, use the installed client's actual path.
node skills/eurekamind/scripts/client.mjs configure --base-url http://127.0.0.1:9052
node skills/eurekamind/scripts/client.mjs me
node skills/eurekamind/scripts/client.mjs capabilities
```

Credentials are saved to `~/.config/eurekamind/credentials.json` with mode 0600 and bound to the configured endpoint. Existing credential managers may supply `EUREKAMIND_API_KEY` and `EUREKAMIND_API_BASE`. Do not put Keys in command arguments, chat, or Git. Cloud agents cannot assume they can access your computer's localhost.

When `me` returns `dataSource: local-demo`, all results are synthetic samples, not your actual content. Once a production service is available, explicitly configure its verified HTTPS endpoint and the corresponding credential.

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
| Audio and text ideas | Search and read quick ideas in different formats | [ideas.md](skills/eurekamind/references/ideas.md) |
| Related assets | Inspect linked assets and download files as needed | [assets.md](skills/eurekamind/references/assets.md) |

The API is read-only. The Key determines the account identity; do not submit userId. See [api.md](skills/eurekamind/references/api.md) for the full contract.

## Version and verification

Skill version: **0.1.0**. Protocol version: **1**. Every client request includes `skill_version` and `protocol_version`. See [CHANGELOG.md](CHANGELOG.md). Automatic upgrade notifications are not implemented.

Run distribution validation and client contract tests without a real account or backend:

```sh
node scripts/check-distribution.mjs
node --test tests/skill-contract.test.mjs
```

GitHub Actions is configured to run these checks on Node.js 18, 22, and 24. The checks have passed locally on Node.js 24; consult the Actions tab for hosted results. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## License and reference

Licensed under the [Apache License 2.0](LICENSE). Repository organization follows the installation entry point, Skill entry point, and functional documentation pattern of [Tencent/WeChatReading](https://github.com/Tencent/WeChatReading). EurekaMind code, documentation, and API contracts are maintained independently. This is not an official Tencent project.
