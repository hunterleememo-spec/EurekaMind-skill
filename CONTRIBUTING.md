# Contributing

The Skill entry point is `skills/eurekamind/SKILL.md`. Functional guides are in `references/`, and the client is `scripts/client.mjs` inside that Skill directory.

After making changes, run:

```sh
node scripts/check-distribution.mjs
node --test tests/skill-contract.test.mjs
```

Tests use temporary credentials and an in-memory HTTP fixture. They do not require a real account. Protocol changes must update the client, api.md, functional guides, and tests together. Version changes must update metadata.version, the client VERSION, README, and CHANGELOG.

Keep published documentation, examples, and user-facing client messages in English.

Include reproduction commands, the Node.js version, and sanitized errors in issues or pull requests. Do not attach API Keys, credential files, original user assets, authorized download links, or internal service configuration. Report security issues through a private channel provided by the maintainers; do not disclose credentials or exploit details in public issues. A dedicated security email address has not been published yet.
