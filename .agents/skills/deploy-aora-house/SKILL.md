---
name: deploy-aora-house
description: Step-by-step deployment workflow for the Aora House project, including local builds, syncing to public, git push, and Namecheap remote restart.
---

# Deploy Aora House

Use this skill whenever you need to deploy the Aora House project to production.

## Deployment Workflow

Follow these exact steps in order when the user asks you to deploy or run the build process:

1. **Pre-flight Safety Check**:
   - Run a backend syntax check: `node --check app.js` to ensure the server will not crash on boot.
   - Run the frontend build: `npm run build` locally in the workspace.
   - **CRITICAL**: If either of these commands fail (exit with an error), HALT the deployment immediately. Do not push. Inform the user and fix the errors before proceeding.
2. **Sync Folders**: 
   - After a successful build, duplicate the contents of `public_html` into `public`. (Ensure old hashed bundles are removed first to prevent bloat).
3. **Commit & Push**: 
   - Commit the latest changes and built files to Git. 
   - Run `git push origin <branch_name>`.
4. **Deploy to Namecheap**:
   - Run SSH command to pull and restart the app on the remote server via configured `rokitonline` SSH alias:
     `ssh -o BatchMode=yes rokitonline 'source /home/rokiroqw/nodevenv/aa/22/bin/activate && cd /home/rokiroqw/aa && CHANGED=$(git diff --name-only HEAD origin/simplification | grep -E "package(-lock)?\.json") && git pull origin simplification && if [ -n "$CHANGED" ]; then echo "Dependencies changed, running npm ci..."; npm ci --omit=dev; fi && touch tmp/restart.txt'`
5. **Verify**:
   - Confirm to the user that the app has been safely checked, built, synced, pushed, and restarted remotely.
