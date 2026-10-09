# Contributing

Thanks for your interest in improving `mauricefun.lol`! This document describes how to set up
the project locally and the conventions we follow.

## Local setup

### Python backend

```bash
# 1. Clone
git clone https://github.com/MauriceBa/VPS_Coding.git
cd VPS_Coding

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 3. Install the package with dev + service extras
pip install -e ".[dev,monitoring,remontees,untappd]"

# 4. Copy environment template and fill in values
cp .env.example .env
```

### JavaScript (games & tools)

```bash
npm install
```

## Quality gates

Run the same checks CI runs before opening a pull request:

```bash
# Python
ruff check .            # lint
ruff format --check .   # formatting
mypy                    # static types
pytest                  # tests

# JavaScript
npm run lint
npm run format:check
npm run test
```

Auto-fix formatting with `ruff format .` and `npm run format`.

## Branch naming

Use a type prefix that mirrors the commit convention:

| Type      | Purpose                          | Example                     |
|-----------|----------------------------------|-----------------------------|
| `feat/`   | New feature                      | `feat/balloon-heatmap`      |
| `fix/`    | Bug fix                          | `fix/solar-timeout`         |
| `chore/`  | Maintenance / tooling            | `chore/professionalize`     |
| `docs/`   | Documentation only               | `docs/update-readme`        |
| `refactor/` | Refactor without behavior change | `refactor/monitoring-module` |

## Commit messages — Conventional Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short imperative summary>

<optional body>

<optional footer>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
`revert`.

Examples:

```
feat(monitoring): add 24h network history endpoint
fix(solar): handle FoxESS API errno responses
docs(readme): document deployment flow
```

## Pull requests

1. Create a branch from `main` following the naming table above.
2. Keep changes focused; one logical change per PR.
3. Ensure all quality gates pass locally.
4. Fill in the PR description: **what**, **why**, and **how it was verified**.
5. Link any related issue.
6. A maintainer will review before merge.

## Never commit secrets

API keys, tokens and credentials belong in `.env` (git-ignored) — never in source. If you discover
a leaked secret, see [`SECURITY.md`](SECURITY.md).
