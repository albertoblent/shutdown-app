# Repository Etiquette Guidelines

## Branch Naming Convention
- **Feature branches**: `feature/short-description` (e.g., `feature/add-timer-component`)
- **Bug fixes**: `fix/issue-description` (e.g., `fix/timer-countdown-bug`)
- **Hotfixes**: `hotfix/critical-issue` (e.g., `hotfix/crash-on-startup`)
- **Chores/maintenance**: `chore/task-description` (e.g., `chore/update-dependencies`)
- **Documentation**: `docs/what-is-documented` (e.g., `docs/api-reference`)

## Git Workflow
- **Primary branch**: `main` (production-ready code)
- **Development approach**: Feature branch workflow
- **Merging strategy**: Squash and merge for feature branches to keep history clean
- **Rebase policy**: Rebase feature branches on main before merging to maintain linear history

## Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

**Types**: feat, fix, docs, style, refactor, test, chore
**Example**: `feat(timer): add countdown animation to shutdown timer`

## Pull Request Guidelines
- PR title should follow commit message format
- Include description of changes and testing performed
- Link related issues with "Closes #XX"
- Ensure all checks pass (lint, build, tests when added)
- Request review from at least one team member

## Code Quality Standards
- Run `npm run lint` before committing
- Ensure `npm run build` succeeds
- No console.logs in production code
- Follow existing TypeScript and React patterns

## Protected Files
- Never commit `.env` files or secrets
- Keep `package-lock.json` in sync
- Don't modify `.gitignore` without team discussion

## Development Process
1. Create feature branch from latest `main`
2. Make atomic commits with clear messages
3. Keep branches small and focused
4. Update branch with main regularly
5. Create PR when feature is complete
6. Address review feedback promptly
7. Delete branch after merge

## GitHub CLI Usage

### Creating Pull Requests
```bash
# Create PR with interactive prompts
gh pr create

# Create PR with title and body
gh pr create --title "feat(timer): add countdown animation" --body "Implements smooth countdown animation for shutdown timer"

# Create draft PR for work in progress
gh pr create --draft --title "WIP: feature name"
```

### Managing Issues
```bash
# Create issue for new feature
gh issue create --label "Phase 1" --label "frontend" --title "Implement habit configuration screen"

# List issues for current milestone
gh issue list --label "Phase 1"

# Close issue with PR
gh pr create --body "Closes #123"
```

### Code Review Workflow
```bash
# Check out a PR locally
gh pr checkout 123

# Review PR from command line
gh pr review --approve
gh pr review --comment "Looks good, just one suggestion..."
gh pr review --request-changes
```

### Release Management
```bash
# Create release after phase completion
gh release create v0.1.0 --title "Phase 1: MVP Complete" --notes "Core shutdown routine functionality"
```

## GitHub Projects Integration

### Project Structure
- **Phase Projects**: Create one project per development phase
  - Phase 1: MVP - Core Shutdown Routine
  - Phase 2: Enhanced Experience
  - Phase 3: Integrations & Automation
  - (etc.)

### Issue Labels
- **Phase labels**: `Phase 1`, `Phase 2`, etc.
- **Component labels**: `frontend`, `backend`, `database`, `infrastructure`
- **Type labels**: `feature`, `bug`, `enhancement`, `technical-debt`
- **Priority labels**: `P0-critical`, `P1-high`, `P2-medium`, `P3-low`

### Issue Templates
Create issues from roadmap items with consistent format:
```
Title: [Component] Feature Description
Body:
## Description
Brief description from roadmap

## Acceptance Criteria
- [ ] Specific requirement 1
- [ ] Specific requirement 2

## Technical Notes
Any implementation details

## Phase
Phase X - [Phase Name]
```

### Automation with GitHub CLI
```bash
# Create multiple issues from roadmap
gh issue create --label "Phase 1" --label "frontend" --title "[Frontend] Basic PWA setup with offline capability"

# Bulk operations
gh issue list --label "Phase 1" --json number,title | jq '.[] | select(.title | contains("[Frontend]"))'

# Move issues to project
gh project item-add PROJECT_NUMBER --owner albertoblent --url ISSUE_URL
```

### Sprint Planning
- Break each phase into 2-week sprints
- Use project boards to track sprint progress
- Move issues through columns: Backlog → Ready → In Progress → Review → Done

### Progress Tracking
```bash
# View project progress
gh project view PROJECT_NUMBER

# List completed items for phase
gh issue list --label "Phase 1" --state closed
```