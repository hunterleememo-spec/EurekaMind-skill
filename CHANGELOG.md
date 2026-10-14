# Changelog

## 0.2.0 — 2026-10-14

- Require an explicit verified service origin; remove localhost from the normal setup flow.
- Require deliberate `--demo` opt-in for local sample access; block legacy implicit loopback configurations.
- Reject sample responses outside demo mode and require environment Key/origin pairs.
- Validate read-only identity before saving credentials; preserve existing configuration on failure.
- Document the standalone `/skills` login return, unverified pre-release Gateway status, and pending Reminders mapping.
- Add regression coverage for missing configuration, demo opt-in, migration and unavailable services.

## 0.1.0 — 2026-10-14

Initial distributable integration preview.

- EurekaMind Skill entry point, guides for six asset types, and shared API contract.
- Node.js standard-library client for credential configuration, identity verification, capability discovery, paginated search, details, transcripts, and file downloads.
- Hidden credential input, mode 0600 credential storage, and endpoint binding.
- Local-directory installation and GitHub repository installation through the skills CLI.
- Independent client contract tests, distribution validation, and GitHub Actions.
- English documentation, examples, and client messages throughout the distribution.

Production authentication, real asset integration, and end-to-end verification for each target agent remain pending.
