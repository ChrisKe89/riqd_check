# RIQD Connectivity Check

This project checks whether devices are connected to RIQD by posting serial-number searches directly to the Fujifilm IQ Timeline endpoint and updating a CSV file accordingly.

Playwright is still used for the one-time SSO/MFA login step that saves an authenticated browser session. Normal runs use the saved session cookies with Node's `fetch`, avoiding fragile browser UI checks.

The environment runs **behind Netskope**, so a trusted root certificate **must be set explicitly each time** before installing dependencies.

***

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8
- Corporate network access (Netskope)

***

## Repo Layout

    riqd-check/
      certs/
        netskope-root.cer
      data/
        riqud_serial.csv
      src/
      test/
      package.json
      .env.example

***

## One‑Time Setup

### 1. Install dependencies (WITH Netskope cert)

> This **must be done from the repo root**  
> This **must be done every time you install dependencies**

#### PowerShell (recommended)

```powershell
$env:NODE_EXTRA_CA_CERTS = "$PWD\certs\netskope-root.cer"
pnpm install
```

This tells Node.js (and pnpm + Playwright) to trust the Netskope inspection certificate **without disabling TLS security**.

***

### 2. Create environment file

```powershell
copy .env.example .env
```

Default values are fine for most cases.

***

## Authentication (Run Once)

The site uses SSO/MFA, so authentication is handled via a stored browser session.

```powershell
pnpm run auth
```

What happens:

1. A browser opens in headed mode
1. Log in normally (SSO / MFA)
1. Perform one serial-number search in the IQ Timeline page
1. Playwright captures the `x-csrftoken` header from the `/iq/timeline` request
1. Click **Resume** in Playwright Inspector
1. `storageState.json` and `.riqd-session.json` are saved

These files are reused for all future runs.

✅ Credentials are **not** stored in code  
✅ `storageState.json` and `.riqd-session.json` are ignored by Git

***

## Normal Execution

```powershell
pnpm run run
```

What the script does:

- Reads `data/riqd_serial.csv`
- Skips rows where `RIQD_Connected = "Y"`
- Posts each remaining serial number to `/iq/timeline`
- Treats the serial as connected when the JSON response contains one or more `analyses`
- If found, updates `RIQD_Connected` to `"Y"`
- Writes changes back to the CSV immediately

You can stop and rerun at any time.

***

## CSV Requirements

The CSV **must include**:

- A serial number column (e.g. `Serial_Number`)
- A column named exactly:
        RIQD_Connected

Example:

```csv
Serial_Number,Description,RIQD_Connected
510036,Revoria EC2,N
510037,Revoria EC2,Y
```

Rows with `RIQD_Connected = Y` are skipped. Blank and `N` values are checked.

***

## Tests

```powershell
pnpm test
```

The tests cover the API response detection and CSV row processing rules.

***

## Common Issues

### TLS / certificate errors during install

You forgot to set the Netskope cert.

✅ Correct:

```powershell
$env:NODE_EXTRA_CA_CERTS = "$PWD\certs\netskope-root.cer"
pnpm install
```

❌ Incorrect:

- `NODE_TLS_REJECT_UNAUTHORIZED=0`
- `strict-ssl=false`
- Installing the cert into Node manually

***

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

During `pnpm run auth`, make sure you perform one serial-number search before clicking **Resume**. If automatic capture still fails, copy the current `x-csrftoken` value from a browser network capture into `CSRF_TOKEN` in `.env`.

***

## Notes

- The cert is **not persisted on purpose**
- This avoids polluting global Node or system trust stores
- Safe for corporate audit environments
