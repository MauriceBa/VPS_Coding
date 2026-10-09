# Security Policy

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public issue. Instead, report it
privately via GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
or by contacting the maintainer directly.

Please include:

- A description of the issue and its impact.
- Steps to reproduce.
- Any suggested remediation.

You can expect an acknowledgement within a few days.

## Secrets handling

- All credentials (Telegram bot token, OpenRouter key, FoxESS API key) are read from environment
  variables. See [`.env.example`](.env.example).
- `.env` is git-ignored. Never commit real credentials.
- If a secret is ever committed, **rotate it immediately** — removing it from a later commit does
  not remove it from git history.

### Known historical exposure

An earlier revision of `ballon_notifier/ballon_bot.py` contained a hardcoded Telegram bot token.
That token has been removed from the source and moved to the `TELEGRAM_BOT_TOKEN` environment
variable, but it **remains in the git history and must be revoked/rotated** via
[@BotFather](https://t.me/BotFather).

## Supported versions

This is a personal project maintained on a best-effort basis; only the `main` branch is supported.
