# Update the GitHub project to v0.12.1

Repository: `bonganimoyo95-jpg/golf-game`

## Upload through GitHub

1. Extract `golf-game-v0.12.1-ready.zip` on your computer.
2. Open the extracted `golf-game` folder.
3. Open the existing `golf-game` repository on GitHub.
4. Select **Add file**, then **Upload files**.
5. Drag everything from inside the extracted `golf-game` folder into GitHub's upload area.
6. Allow GitHub to replace existing files and add the new files.
7. Use this commit message:

   `Polish mobile game layout and shot tips`

8. Commit the changes to `main`.

Do not upload the ZIP itself, `node_modules`, `dist` or `tsconfig.tsbuildinfo`.

## Publish the live game

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**. The updated workflow builds `dist/`, runs the checks, then publishes it.
3. Open **Actions** and select **Verify and publish Pocket Golf**. Wait for both the verification and deployment jobs to finish successfully.
4. Reload `https://bonganimoyo95-jpg.github.io/golf-game/`. The landing page iframe already uses this URL, so it will show the updated game without a landing-page change.

If the Pages source is already **GitHub Actions**, leave it as is. If the first deployment fails before the source is changed, change the source and rerun the workflow from the Actions page.

## Refresh the Codespace

```bash
git pull origin main
npm install
npm run typecheck
npm test
npm run build
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Open forwarded port `5173`. Add `?qa=1` to the forwarded URL to open the QA Lab.

## Required browser acceptance

Run the focused acceptance pass in `docs/PROJECT_2_CHECKPOINT_6.md`. GitHub Actions will run the browser smoke tests automatically after upload.
