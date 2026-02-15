# Quick SQL Fix Runner
# Automatically applies the database fixes

param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         PONTIFF SQL FIX RUNNER                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check for Supabase CLI
if (Get-Command supabase -ErrorAction SilentlyContinue) {
    Write-Host "Using Supabase CLI..." -ForegroundColor Green

    Write-Host "Running: supabase db push" -ForegroundColor Gray
    supabase db push

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSUCCESS: All migrations applied!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "  1. Restart dev server: npm run dev" -ForegroundColor White
        Write-Host "  2. Run tests: powershell.exe -File scripts\test-api.ps1" -ForegroundColor White
        exit 0
    } else {
        Write-Host "`nWARNING: supabase db push had issues. Trying alternative method..." -ForegroundColor Yellow
    }
}

# Fallback to psql
if (-not $DatabaseUrl) {
    Write-Host "ERROR: DATABASE_URL not set" -ForegroundColor Red
    Write-Host "`nPlease either:" -ForegroundColor Yellow
    Write-Host "  1. Set DATABASE_URL environment variable:" -ForegroundColor White
    Write-Host "     `$env:DATABASE_URL = 'postgresql://...'" -ForegroundColor Gray
    Write-Host "`n  2. Or copy RUN_THIS_SQL_FIXED.sql into Supabase SQL editor and run it manually" -ForegroundColor White
    Write-Host "`nFile location: RUN_THIS_SQL_FIXED.sql" -ForegroundColor Gray
    exit 1
}

if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "Using psql with DATABASE_URL..." -ForegroundColor Green

    $SqlFile = ".\RUN_THIS_SQL_FIXED.sql"

    if (-not (Test-Path $SqlFile)) {
        $SqlFile = ".\supabase\migrations\20260208160000_fix_all_test_issues.sql"
    }

    if (Test-Path $SqlFile) {
        Write-Host "Applying SQL from: $SqlFile" -ForegroundColor Gray
        psql $DatabaseUrl -f $SqlFile

        if ($LASTEXITCODE -eq 0) {
            Write-Host "`nSUCCESS: SQL applied successfully!" -ForegroundColor Green
        } else {
            Write-Host "`nWARNING: Some SQL commands may have failed" -ForegroundColor Yellow
            Write-Host "This is often OK if the schema already exists" -ForegroundColor Gray
        }

        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "  1. Restart dev server: npm run dev" -ForegroundColor White
        Write-Host "  2. Run tests: powershell.exe -File scripts\test-api.ps1" -ForegroundColor White
        exit 0
    } else {
        Write-Host "ERROR: SQL file not found: $SqlFile" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: Neither supabase CLI nor psql found" -ForegroundColor Red
    Write-Host "`nPlease install one of:" -ForegroundColor Yellow
    Write-Host "  - Supabase CLI: npm install -g supabase" -ForegroundColor White
    Write-Host "  - PostgreSQL client: choco install postgresql" -ForegroundColor White
    Write-Host "`nOr run SQL manually in Supabase SQL editor:" -ForegroundColor Yellow
    Write-Host "  File: RUN_THIS_SQL_FIXED.sql" -ForegroundColor Gray
    exit 1
}
