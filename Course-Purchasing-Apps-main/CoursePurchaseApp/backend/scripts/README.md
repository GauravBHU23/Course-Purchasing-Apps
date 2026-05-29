# User data export & archive

Generate CSV files of every registered user — and keep their records **even after
they are deleted** from the database.

## What's here

| File | Purpose |
|------|---------|
| `01_setup_user_archive.sql` | Creates `user_audit_log` + a trigger on `users`. After this, every insert/update/delete is logged permanently. Run once (safe to re-run). |
| `02_export_users.sql` | Exports all **current** users to CSV. |
| `03_export_audit_log.sql` | Exports the **full history** including deleted users. |
| `export_users.ps1` | Windows one-click: setup + both exports, timestamped. |
| `export_users.sh` | Linux/macOS one-click: same as above. |

CSVs land in `backend/exports/` with a timestamp, so old exports are never overwritten.
Password hashes are **never** exported.

## Quick start (Windows)

From the `backend` folder:

```powershell
./scripts/export_users.ps1
```

## Quick start (Linux / macOS)

```bash
chmod +x scripts/export_users.sh   # first time only
./scripts/export_users.sh
```

## Custom database connection

Set env vars before running (defaults shown):

```
PGHOST=localhost  PGPORT=5432  PGUSER=postgres  PGDATABASE=course_app  PGPASSWORD=postgres
```

## How deletion-proofing works

The trigger copies every user change into `user_audit_log`, which has **no foreign
key** to `users`. When a user is deleted, the `DELETE` event (with their email, name,
role, etc.) stays in the audit log forever. `03_export_audit_log.sql` includes a
`currently_exists` column so you can tell active vs. deleted users apart.
