# Contributing to TalentPulse

Thank you for your interest in contributing to TalentPulse!

## Code of Conduct

By participating in this project, you agree to uphold a respectful, inclusive environment for all contributors.

## Development Setup

```bash
git clone https://github.com/21leahcimhtiek-oss/talentpulse.git
cd talentpulse
npm install
cp .env.example .env.local
# Fill in your API keys
npm run dev
```

## Branch Strategy

- `main` — production-ready code only
- `develop` — integration branch
- `feature/*` — new features (branch from develop)
- `fix/*` — bug fixes
- `chore/*` — maintenance, dependency updates

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add 360 feedback export to CSV
fix: correct OKR progress calculation for zero targets
chore: update openai to v4.52
docs: add API authentication guide
test: add coaching generation retry test
refactor: extract rate limiting middleware
```

## Pull Request Requirements

1. Branch from `develop`, not `main`
2. All tests pass: `npm test`
3. TypeScript checks pass: `npm run typecheck`
4. Linting passes: `npm run lint`
5. PR description explains the change and motivation
6. New features include tests (aim for >70% coverage)
7. Breaking changes are documented in the PR body

## Code Style

- TypeScript strict mode — no `any` types
- Tailwind CSS for all styling — no inline styles
- Zod for all validation schemas
- `cn()` utility for conditional class names
- All async functions wrapped in try/catch with Sentry capture

## Testing Requirements

- Unit tests for all API route handlers
- Unit tests for all OpenAI utility functions (with mocked API calls)
- E2e tests for critical user journeys (auth, OKR creation, review submission)

## Review Process

1. Open a PR against `develop`
2. A maintainer will review within 2 business days
3. Address feedback with new commits (don't force push)
4. Once approved, maintainer will merge

## Release Process

Maintainers only:
1. Merge `develop` → `main`
2. Update `CHANGELOG.md`
3. Tag release: `git tag v1.x.x`
4. Push tag to trigger deployment