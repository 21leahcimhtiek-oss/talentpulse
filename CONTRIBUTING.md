# Contributing to TalentPulse

Thank you for your interest in contributing to TalentPulse! This document outlines everything you need to know to make a meaningful contribution.

---

## Code of Conduct

By participating in this project, you agree to uphold our Code of Conduct. We are committed to a welcoming, inclusive environment for all contributors regardless of background, identity, or experience level. Harassment or exclusionary behavior will not be tolerated.

---

## Fork and Branch Strategy

### Setup

1. Fork the repository to your GitHub account
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/talentpulse.git
cd talentpulse
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/21leahcimhtiek-oss/talentpulse.git
```

4. Keep your fork up to date:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### Branch Naming Convention

Create branches from `main` using the following prefixes:

| Prefix | Purpose | Example |
|---|---|---|
| feature/ | New features | feature/ai-sentiment-dashboard |
| fix/ | Bug fixes | fix/auth-session-refresh-loop |
| chore/ | Maintenance, deps, tooling | chore/upgrade-openai-sdk |
| docs/ | Documentation changes | docs/update-api-reference |
| test/ | Test additions or fixes | test/add-bias-detection-unit-tests |
| refactor/ | Code restructuring | refactor/extract-kpi-card-component |

```bash
git checkout -b feature/my-new-feature
```

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase account (free tier works for development)
- An OpenAI API key (for AI feature development)

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your local credentials

# Start development server
npm run dev
```

### Verify Your Setup

```bash
npm run typecheck    # Must pass with zero errors
npm run lint         # Must pass with zero warnings
npm test             # Unit tests must pass
```

---

## Commit Message Format

We use Conventional Commits. Every commit message must follow this format:

```
<type>(<optional scope>): <short summary in present tense>

[optional body: explain WHY, not WHAT]

[optional footer: breaking changes, issue references]
```

### Commit Types

| Type | Use When |
|---|---|
| feat | Adding a new feature |
| fix | Fixing a bug |
| chore | Maintenance, dependency updates, build tooling changes |
| docs | Documentation changes only |
| test | Adding or fixing tests |
| refactor | Code change that neither adds a feature nor fixes a bug |
| perf | Performance improvement |
| ci | CI/CD pipeline changes |

### Examples

```
feat(okr): add at-risk alert email notification when progress drops below 30%
fix(auth): resolve infinite refresh loop when token expires during active session
chore(deps): upgrade openai package to 4.52.0
docs(readme): update quick start instructions for Windows users
test(reviews): add unit tests for GPT-4o bias detection utility function
refactor(dashboard): extract KPI card into reusable component with typed props
```

---

## Pull Request Requirements

### Before Opening a PR

- [ ] TypeScript compiles with zero errors: npm run typecheck
- [ ] ESLint passes with zero errors: npm run lint
- [ ] All existing unit tests pass: npm test
- [ ] New features have unit tests covering happy path and key error cases
- [ ] No console.log statements left in production code paths
- [ ] No any types introduced (strict TypeScript enforced; use unknown with type guards)
- [ ] No unused variables or imports
- [ ] No hardcoded secrets or API keys

### PR Description

Every PR must include:

1. What this PR does: one-sentence summary
2. Why: motivation, linked issue (e.g., Closes #42), or context
3. How to test: steps to manually verify the change works
4. Screenshots: required for any UI changes
5. Breaking changes: explicitly call out if any exist

### PR Size Guidelines

- Keep PRs focused on a single concern
- PRs over 500 lines of changes should include a detailed walkthrough in the description
- Large features should be broken into a sequence of smaller, reviewable PRs

---

## Code Style

### TypeScript

- Strict mode is non-negotiable. No ts-ignore comments without a clear explanation of why.
- Do not use any types. Use unknown with type guards, or define proper types and interfaces.
- Prefer interface over type for object shapes unless union types are required.
- All exported functions must have explicit return type annotations.
- Keep functions short (under 40 lines). Extract helper functions when needed.

### Component Patterns

- Use React Server Components by default. Add the use client directive only when the component requires browser APIs, event handlers, or React state and effects.
- Co-locate component types with the component file.
- Extract reusable stateful logic into custom hooks under src/hooks/.
- Keep components under 200 lines. Extract sub-components when they grow larger.

### Naming Conventions

- Components: PascalCase (e.g., EmployeeCard, OKRProgressBar)
- Hooks: camelCase with use prefix (e.g., useTeamHealth, useCurrentUser)
- Utilities: camelCase (e.g., formatCurrency, calculateHealthScore)
- API route handlers: uppercase HTTP method names (GET, POST, PATCH, DELETE)
- Database table names: snake_case (enforced by Supabase)
- Environment variables: SCREAMING_SNAKE_CASE

### ESLint and Formatting

- ESLint configuration is in .eslintrc.json. Run npm run lint before every commit.
- Prettier formats all TypeScript and TSX files. Run npm run format before committing.
- 2-space indentation, single quotes for strings, trailing commas in multi-line structures.
- No commented-out code in PRs.

---

## Testing Requirements

### Unit Tests (Jest + React Testing Library)

- Every utility function in src/lib/ must have unit test coverage
- Every API route handler must have integration tests covering success and error cases
- Coverage thresholds enforced in CI: 60% branches, functions, lines, and statements
- Test files live in __tests__/ mirroring the src/ directory structure
- Use descriptive test names: it returns 401 when auth token is missing

### End-to-End Tests (Playwright)

The following critical user flows must have E2E test coverage:

1. Authentication: sign up, log in, log out, password reset
2. OKR creation and progress update
3. Performance review submission with bias detection
4. Billing: plan upgrade via Stripe checkout
5. Team health dashboard loads with data

E2E tests live in the e2e/ directory.

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage report
npm run test:coverage

# E2E tests (requires dev server running)
npm run test:e2e
```

---

## Review Process

1. Open a PR against main
2. CI runs automatically: lint, typecheck, test, build
3. At least one maintainer approval is required before merging
4. All review comments must be resolved or explicitly dismissed with a reply explaining why
5. Maintainers will squash-merge the PR using a conventional commit message

---

## Release Process

1. Maintainer creates a release branch: release/v1.x.x
2. Version bumped in package.json and product.json
3. CHANGELOG.md updated following Keep a Changelog format
4. PR opened from release/v1.x.x to main
5. PR reviewed and merged after CI passes
6. GitHub Release created with tag v1.x.x and release notes from CHANGELOG
7. Vercel auto-deploys the new version to production on merge to main

---

## Getting Help

- Questions and discussions: GitHub Discussions at https://github.com/21leahcimhtiek-oss/talentpulse/discussions
- Bug reports: GitHub Issues using the bug report template
- Feature requests: GitHub Issues using the feature request template
- Security vulnerabilities: Email security@aurorarayes.com directly. Do not open a public issue.
- General inquiries: opensource@aurorarayes.com

---

Thank you for helping make TalentPulse better. Every contribution, no matter how small, is valued.