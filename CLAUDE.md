# Repository Etiquette Guidelines

## Branch Naming Convention

- **Feature branches**: `feature/issue-#-description` (e.g., `feature/issue-5-habit-management`)
- **Bug fixes**: `fix/issue-#-description` (e.g., `fix/issue-12-timer-bug`)
- **Hotfixes**: `hotfix/issue-#-description` (e.g., `hotfix/issue-15-crash`)
- **Chores/maintenance**: `chore/issue-#-description` (e.g., `chore/issue-8-update-deps`)
- **Documentation**: `docs/description` (e.g., `docs/api-reference`)
- **Subtask branches**: `feature/issue-#-subtask-description` (e.g., `feature/issue-5-subtask-drag-drop`)

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
- Ensure all checks pass (lint, tests, build)
- Update CHANGELOG.md with changes (add to [Unreleased] section)
- Self-review changes before merging
- Document any deviations from original plan

## Code Quality Standards

- Run `npm run lint` before committing
- Run `npm test` to ensure all tests pass
- Ensure `npm run build` succeeds
- No console.logs in production code
- Follow existing TypeScript and React patterns

## Testing Standards

- Follow Test-Driven Development (TDD) approach
- Write tests before implementing new features when possible
- All data layer functions must have comprehensive unit tests
- Test commands:
  - `npm test` - Run all tests
  - `npm run test:ui` - Run tests with UI interface
  - `npm run test:coverage` - Run tests with coverage report
- Minimum test coverage: 80% for utility functions, 60% for components
- Test files should be co-located with source files using `.test.ts` or `.spec.ts` extension

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

## Release Process

1. Update CHANGELOG.md with new version section
2. Bump version in package.json and manifest.json
3. Commit version changes: `git commit -m "chore: bump version to 0.X.0"`
4. Create git tag: `git tag v0.X.0`
5. Push changes and tags: `git push origin main --tags`

## Solo Development Workflow

### 1. Issue Selection and Planning

```bash
# View current project board status
gh issue list --label "Phase 1" --json number,title,labels,assignees | jq -r '.[] | select(.assignees | length == 0) | "Issue #\(.number): \(.title)"'

# Assign yourself to an issue
gh issue edit ISSUE_NUMBER --add-assignee @me

# View issue details and subtasks
gh issue view ISSUE_NUMBER
```

### 2. Branch Creation Strategy

```bash
# For main issue work
git checkout main
git pull origin main
git checkout -b feature/issue-1-typescript-config

# For complex subtasks (optional)
git checkout -b feature/issue-1-subtask-vite-config

# Link branch to issue automatically
gh issue develop ISSUE_NUMBER --checkout
```

### 3. Development Workflow

#### Working on an Issue

1. **Start work**: Update issue status in project board
2. **Regular commits**: Make atomic commits for each logical change
3. **Update progress**: Check off subtasks in issue as completed
4. **Document blockers**: Comment on issue if stuck

#### Commit Guidelines

```bash
# Atomic commits with issue reference
git commit -m "feat(typescript): configure strict mode settings (#1)"
git commit -m "feat(typescript): add project folder structure (#1)"

# Quick status check
git log --oneline -5
```

### 4. Progress Tracking

```bash
# Update issue with progress comment
gh issue comment ISSUE_NUMBER --body "Completed TypeScript configuration. Moving on to Vite setup."

# Check off subtasks (edit issue body)
gh issue edit ISSUE_NUMBER

# View your assigned issues
gh issue list --assignee @me --label "Phase 1"
```

### 5. Pull Request Workflow

```bash
# Push branch and create PR
git push -u origin feature/issue-1-typescript-config
gh pr create --fill --body "Closes #1"

# For work in progress
gh pr create --draft --title "WIP: TypeScript Configuration (#1)"

# Convert draft to ready
gh pr ready PR_NUMBER
```

### 6. Code Review (Self-Review)

Before marking PR as ready:

1. Review your own changes: `gh pr diff`
2. Run quality checks: `npm run lint && npm run build`
3. Test functionality manually
4. Update documentation if needed

### 7. Merge and Cleanup

```bash
# After self-review and checks pass
gh pr merge PR_NUMBER --squash

# Cleanup local branches
git checkout main
git pull origin main
git branch -d feature/issue-1-typescript-config

# Move to next issue
gh issue list --assignee @me --label "Phase 1" --state open
```

### Flexible Optimization Tips

1. **Batch Related Work**: If working on related issues, consider a combined branch
2. **Subtask Branches**: Only create for complex subtasks that need isolation
3. **Quick Fixes**: For tiny fixes, commit directly to issue branch
4. **Stacking PRs**: For dependent features, stack PRs using `--base` flag
5. **Time Boxing**: Set daily goals like "Complete 2 subtasks of Issue #3"

### Daily Workflow Example

```bash
# Morning: Check status
gh issue list --assignee @me --state open
gh pr list --author @me

# Select today's focus
gh issue view 3  # Review what needs doing

# Create/switch to branch
git checkout feature/issue-3-localstorage

# Work and commit atomically
# ... make changes ...
git add -p  # Stage selectively
git commit -m "feat(storage): implement Zod validation schemas (#3)"

# Afternoon: Update progress
gh issue comment 3 --body "✅ Completed Zod schemas\n⏳ Working on localStorage utilities"

# End of day: Push progress
git push origin feature/issue-3-localstorage
```

### Claude Code Integration

When working with Claude Code on issues:

1. **Start Session with Context**:
   - Open issue: `gh issue view ISSUE_NUMBER`
   - Share issue details with Claude
   - Reference CLAUDE.md for workflow

2. **Collaborative Development**:
   - Let Claude handle file creation/editing
   - You handle git operations and testing
   - Claude can read test results and iterate

3. **Progress Documentation**:
   - Ask Claude to summarize completed work
   - Use summaries for issue comments
   - Document any architectural decisions

4. **Issue Handoff**:
   - When switching issues, provide Claude with:
     - New issue number and details
     - Current branch status
     - Any blocking dependencies

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

```md
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

## Quick Command Reference

### Daily Commands

```bash
# Start of day
gh issue list --assignee @me --state open  # Your open issues
gh pr list --author @me                    # Your open PRs

# Issue work
gh issue view NUMBER                       # Review issue details
gh issue develop NUMBER --checkout         # Create branch for issue
gh issue comment NUMBER --body "Update"    # Progress update

# Commits and PRs
git add -p                                 # Stage selectively
git commit -m "type(scope): message (#N)"  # Commit with issue ref
gh pr create --fill                        # Create PR from template
gh pr merge NUMBER --squash                # Merge when ready

# Project tracking
gh issue list --label "Phase 1" --state open --json number,title,labels
```

### Useful Aliases

Add to your shell profile:

```bash
alias ghi='gh issue'
alias ghpr='gh pr'
alias ghil='gh issue list --assignee @me'
alias ghprl='gh pr list --author @me'
```

## Memory Reminder

- If working on a github issues, always remember to update the status accordingly