# RIQD Connectivity Check

This project checks whether devices are connected to RIQD by posting serial-number
searches directly to the Fujifilm IQ Timeline endpoint and updating a CSV file accordingly.

Playwright is used for authentication capture.

if you are running in the corporate environment, **behind Netskope**, a trusted root certificate **must be set explicitly each time** before installing dependencies.

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8

## Repo Layout

```text
    riqd-check/
      certs/
        netskope-root.cer
      data/
        riqd_serial.csv
      src/
      test/
      package.json
      .env.example
```

## One‑Time Setup

### 1. Install dependencies

> This **must be done from the repo root**  
> This **must be done every time you install dependencies**

#### *Corporate Environment*

```powershell
$env:NODE_EXTRA_CA_CERTS = "$PWD\certs\netskope-root.cer"
pnpm install
```

This tells Node.js (and pnpm + Playwright) to trust the Netskope inspection certificate **without disabling TLS security**.

#### *Personal Environment*

```powershell
pnpm install
```

### 2. Create environment file

```powershell
copy .env.example .env
```

Default values are fine for most cases.

## Authentication (Run Once)

The site uses MFA, so authentication is handled via a stored browser session.

```powershell
pnpm run auth
```

 What happens:

 1. A browser opens in headed mode

 1. Log in normally (MFA)

 1. Perform one serial-number search in the IQ Timeline page

 1. Playwright captures the `x-csrftoken` header from the `/iq/timeline` request

 1. Click **Resume** in Playwright Inspector

 1. `storageState.json` and `.riqd-session.json` are saved

 These files are reused for all future runs.

 ✅ Credentials are **not** stored in code  
 ✅ `storageState.json` and `.riqd-session.json` are ignored by Git

## Normal Execution

```powershell
pnpm run run
```

 What the script does:

- Reads `data/riqd_serial.csv`

- Skips rows where `RIQD_Connected = "Y"`

- Posts each remaining serial number to `/iq/timeline`

- Shows a live terminal progress panel with total serials, already-connected serials, pending checks, current serial, latest result, update count, and errors

- Treats the serial as connected when the JSON response contains one or more `analyses`

- If found, updates `RIQD_Connected` to `"Y"`

- Writes changes back to the CSV immediately

- Copies the completed CSV to `CSV_OUTPUT` when that setting is present in `.env`

 You can stop and rerun at any time.

### Terminal Output

The CLI will show you the current status of the run.

```powershell
RIQD Serial Check
Total Serials:        752
RIQD Connected:       0
Pending RIQD Checks:  752
Checking:             752 of 752
Serial:               141814 (row 752)
Latest:               141814 -> not connected
Updated This Run:     23
Errors:               0
```

## Windows wrappers

For normal scheduled or on-demand Windows use:

```powershell
pnpm run run:windows
```

For refreshing the saved login/session:

```powershell
pnpm run auth:windows
```

>`run:windows` writes a timestamped log under `logs/`, forces `HEADLESS=true`, and stops the run if it exceeds 20 minutes.
>

## Scheduled task

Run this once from PowerShell in the repo root to create the scheduled task:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\register-riqd-scheduled-task.ps1
```

The task is registered as `RIQD Connectivity Check` for the current Windows user.
It runs Monday to Friday at 9:30 AM, starts when available if the scheduled time was missed, runs headless,
stops after 20 minutes, and retries up to 3 times with a 5-minute interval.

To create it from any location:

```powershell
$RepoRoot = "C:\Users\ckent\dev\experiments\riqd_check"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$RepoRoot\scripts\register-riqd-scheduled-task.ps1" -RepoRoot $RepoRoot
```

## CSV Requirements

The CSV **must include**:

- `Serial_Number`
- `Product_Code`
- `Product_Family`
- `RIQD_Connected`

Example:

```csv
Serial_Number,Product_Code,Product_Family,RIQD_Connected
510036,EC2,Revoria,N
510037,EC2,Revoria,Y
510038,EC2,Revoria,
```

> Rows where `RIQD_Connected` = `Y` are skipped.
>
> Rows where `RIQD_Connected` = `N` and `Blank` values are checked.

## CSV Output

If you want the CSV to be output for SnowFlake to pick it up, change the following variable.

```bash
CSV_OUTPUT=
```

If `CSV_OUTPUT` is set, the output file keeps the same filename as `CSV_PATH` and is copied into that directory after each run.

## Tests

```powershell
pnpm test
```

The tests cover the API response detection and CSV row processing rules.

## Common Issues

### TLS / certificate errors during install

You forgot to set the Netskope cert.

✅ Correct:

```powershell
$env:NODE_EXTRA_CA_CERTS = "$PWD\certs\netskope-root.cer"
pnpm install
```

### Playwright browsers not found

Re-run install with cert set:

```powershell
$env:NODE_EXTRA_CA_CERTS = "$PWD\certs\netskope-root.cer"
pnpm install
```

### Missing CSRF token

Refresh the saved session:

```powershell
pnpm run auth
```

During `pnpm run auth`, make sure you perform one serial-number search before clicking **Resume**.

If automatic capture still fails, copy the current `x-csrftoken` value from a browser network capture into `CSRF_TOKEN` in `.env`.

## Notes

- *The cert is **not persisted on purpose***
- *This avoids polluting global Node or system trust stores*
- *Safe for corporate audit environments*
