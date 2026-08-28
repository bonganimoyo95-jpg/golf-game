# Update the GitHub project to v0.11.0

Repository: `bonganimoyo95-jpg/golf-game`

## Upload through GitHub

1. Extract `golf-game-shot-planning-v0.11.0-ready.zip` on your computer.
2. Open the extracted `golf-game` folder.
3. Open the existing `golf-game` repository on GitHub.
4. Select **Add file**, then **Upload files**.
5. Drag everything from inside the extracted `golf-game` folder into GitHub's upload area.
6. Allow GitHub to replace existing files and add the new files.
7. Use this commit message:

   `Improve shot planning and recovery play`

8. Commit the changes to `main`.

Do not upload the ZIP itself, `node_modules`, `dist` or `tsconfig.tsbuildinfo`.

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

Run the focused acceptance pass in `docs/PROJECT_2_CHECKPOINT_5.md`, then repeat the broader course and penalty checks in `docs/PROJECT_2_CHECKPOINT_1.md`.
