Analyze all recent git changes and update project documentation before committing.

## Steps

1. **Analyze changes**: Run `git status` and `git diff --staged` and `git diff` to understand what changed since the last commit.

2. **Update docs/CHANGELOG.md**: Add a new entry at the top under the current date. Group changes by type:
   - **Added**: New features or files
   - **Changed**: Modifications to existing functionality
   - **Fixed**: Bug fixes
   - **Removed**: Deleted features or files
   Keep entries concise (one line each). Use the format `- [area] description`.

3. **Update docs/ARCHITECTURE.md**: Only if structural changes occurred (new directories, new major modules, changed routing, new database tables, changed data flow). If no structural changes, skip this step entirely and say so.

4. **Update docs/PRODUCT_STATUS.md**: Review the MVP/V1/V2 checklists and mark items as complete if the current changes fulfill them. Update any progress notes.

5. **Stage and commit**: Stage all changes (including the updated docs) and create a commit. Use a clear commit message summarizing the main changes. Follow the repository convention of never committing directly to main — if on main, warn the user and ask them to create a branch first.
