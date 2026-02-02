---
description: Commits changes and syncs current branch to main for Vercel deployment
---

This workflow automates the process of committing changes and ensuring they are deployed to Vercel by merging the current feature branch into `main`.

1. **Check Status**
   - Run `git status` to see pending changes.

2. **Stage and Commit**
   - Run `git add .` to stage all changes.
   - **User Input Required**: Ask the user for a commit message if one wasn't provided in the initial request.
   - Run `git commit -m "<message>"`

3. **Push Feature Branch**
   - Determine the current branch name using `git branch --show-current`.
   - Run `git push origin <current_branch>` to save work to the remote feature branch.

4. **Sync with Main (Vercel Trigger)**
   - Check if the current branch is `main`.
   - **If NOT `main`**:
     - Switch to main: `git checkout main`
     - Pull latest changes: `git pull origin main`
     - Merge the feature branch: `git merge <current_branch>`
     - Push to trigger Vercel: `git push origin main`
     - Switch back to feature branch: `git checkout <current_branch>`
   - **If `main`**:
     - You have already pushed to main in step 3, so Vercel is triggered.

5. **Confirmation**
   - Notify the user that the changes have been pushed and Vercel deployment should be triggered.
