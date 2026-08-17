# Update the GitHub project to v0.2

Repository: `bonganimoyo95-jpg/golf-game`

## Upload through GitHub

1. Extract `golf-game-physics-v0.2.zip` on your computer.
2. Open the extracted `golf-game` folder.
3. Open the existing `golf-game` repository on GitHub.
4. Select **Add file**, then **Upload files**.
5. Drag everything from inside the extracted `golf-game` folder into GitHub's upload area.
6. Allow GitHub to replace the files that already exist and add the new files.
7. Enter this commit message:

   `Add deterministic shot physics sandbox`

8. Commit the changes to `main`.

Do not upload the ZIP itself, `node_modules`, `dist` or `tsconfig.tsbuildinfo`.

## Refresh the open Codespace

1. Return to the Codespace.
2. Stop the running game with **Ctrl+C** in the terminal.
3. Run:

   ```bash
   git pull
   npm install
   npm run dev
   ```

4. Reopen or refresh the forwarded port `5173` game tab.

## Expected new files

- `CHANGELOG.md`
- `docs/PROJECT_1_CHECKPOINT_2.md`
- `src/game/courseModel.ts`
- `src/game/physics/shotPhysics.ts`
- `src/game/physics/shotPhysics.test.ts`
