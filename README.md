# RIQD Connectivity Check – Playwright Automation

This project uses **Playwright (Node.js)** to check whether devices are connected to RIQD by searching serial numbers on the Fujifilm IQ Timeline site and updating a CSV file accordingly.

The environment runs **behind Netskope**, so a trusted root certificate **must be set explicitly each time** before installing dependencies.

***

## Prerequisites

*   **Node.js** ≥ 18
*   **pnpm** ≥ 8
*   Corporate network access (Netskope)

***

## Repo Layout

    riqd-check/
      certs/
        netskope-root.cer
      data/
        riqud_serial.csv
      src/
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

1.  A browser opens in headed mode
2.  Log in normally (SSO / MFA)
3.  Playwright Inspector opens and pauses
4.  Click **Resume**
5.  A `storageState.json` file is saved

This file is reused for all future runs.

✅ Credentials are **not** stored in code  
✅ `storageState.json` is ignored by Git

***

## Normal Execution

```powershell
pnpm run run
```

What the script does:

*   Reads `data/riqd_serial.csv`
*   Processes **only rows where `RIQD_Connected = "N"`**
*   Searches each serial number
*   Detects connection by presence of the **IQ Score History** panel
*   If found → updates `RIQD_Connected` to `"Y"`
*   Writes changes back to the CSV immediately (crash‑safe)

You can stop and rerun at any time.

***

## CSV Requirements

The CSV **must include**:

*   A serial number column (e.g. `Serial_Number`)
*   A column named exactly:
        RIQD_Connected

Example:

```csv
Serial_Number,Description,RIQD_Connected
510036,Revoria EC2,N
510037,Revoria EC2,Y
```

Only rows with `RIQD_Connected = N` are processed.

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

*   `NODE_TLS_REJECT_UNAUTHORIZED=0`
*   `strict-ssl=false`
*   Installing the cert into Node manually

***

### Playwright browsers not found

Re-run install with cert set:

```powershell
$env:NODE_EXTRA_CA_CERTS = "$PWD\certs\netskope-root.cer"
pnpm install
```

***

## Notes

*   The cert is **not persisted on purpose**
*   This avoids polluting global Node or system trust stores
*   Safe for corporate audit environments