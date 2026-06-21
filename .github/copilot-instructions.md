# Copilot Instructions — Solvex AI Blogger (Client)

## What this plugin is
`solvex-ai-blogger` is the **client** plugin users install on their WordPress site. It provides
the React dashboard (`src/dashboard/`), campaigns, the onboarding wizard, and Post Ideas. It
talks to the backend plugin (`wp-ai-blogger-server`) over REST — it never calls Gemini
directly. Version constant: `WPSOLVEX_AUTOAIBLOGGER_VERSION`.

---

## Releasing & version bumps (IMPORTANT — do this automatically)

When the user asks to **update the version** or **release** the plugin, ALWAYS use the
Gruntfile tasks. NEVER hand-edit version strings in individual files.

### 1. Bump the version (updates all version files):
```powershell
grunt version-bump --ver=X.Y.Z
```
This updates `package.json`, the `Version:` header and `WPSOLVEX_AUTOAIBLOGGER_VERSION`
constant in `solvex-ai-blogger.php`, and `Stable tag:` in `readme.txt`.

### 2. Build the front-end assets (Windows needs the heap flag):
```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build
```
Without the heap flag the webpack build can fail with an out-of-memory error.

### 3. Build the release zip:
```powershell
grunt release
```
> Note: `grunt release` only builds the zip — it does NOT bump the version. Always run
> `grunt version-bump` first.

### Full release order:
1. Update `changelog.txt` (manual — see rules below).
2. `grunt version-bump --ver=X.Y.Z`
3. `$env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build`
4. `grunt release`

### Do NOT bump the version unless asked
While iterating on a feature, the user may want to keep the **same** version and just rebuild/release the zip with the latest code. Only increase the version number when the user **explicitly** asks for it. Otherwise, skip the `version-bump` step and just rebuild assets + `grunt release` at the current version.

---

## Changelog rules (`changelog.txt`)

Write entries that are **human-readable and non-technical** — understandable in one reading,
months later, without digging into the code.

- One short line per **user-facing** change.
- Describe the benefit/behavior, not the implementation.
- Do NOT name internal functions, components, endpoints, or variables.
- Group under the version header: `X.Y.Z - YYYY-MM-DD`.

**Good:**
```
1.0.2 - 2026-06-18
* Added: Generated posts now fill in SEO details automatically for better Yoast scores.
* Fixed: The "Finish Setup" checkmarks now only appear once each field meets its minimum length.
```

**Bad (too technical — avoid):**
```
* Fixed: FormField checkmark now validates value.trim().length >= minLength instead of value && !error.
```

---

## Build / dev notes
- The React dashboard lives in `src/dashboard/`; built assets go to `assets/build/`.
- Always run the build with `NODE_OPTIONS="--max-old-space-size=4096"` on Windows.

## Git
- Push/pull/merge via **GitHub Desktop only** (the remote was treated as compromised — do not `git pull`/`git fetch`).
- Include the standard `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>` trailer on commits (unless the user says otherwise).
