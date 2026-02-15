# Apply All Pontiff API Fixes
# This script applies database migrations and verifies the setup

param(
    [switch]$SkipMigrations,
    [switch]$SkipTests
)

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       PONTIFF API FIX APPLICATION SCRIPT          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Check if Supabase CLI is available
Write-Host "Step 1: Checking Supabase CLI..." -NoNewline
try {
    $null = supabase --version
    Write-Host " [OK]" -ForegroundColor Green
    $HasSupabaseCLI = $true
}
catch {
    Write-Host " [NOT FOUND]" -ForegroundColor Yellow
    Write-Host "  Supabase CLI not found. Will skip automatic migrations." -ForegroundColor Yellow
    Write-Host "  Install: https://supabase.com/docs/guides/cli`n" -ForegroundColor Gray
    $HasSupabaseCLI = $false
}

# Step 2: Apply Migrations
if (-not $SkipMigrations) {
    Write-Host "`nStep 2: Applying Database Migrations..." -ForegroundColor Yellow

    if ($HasSupabaseCLI) {
        Write-Host "  Running: supabase db push" -ForegroundColor Gray
        try {
            supabase db push
            Write-Host "  Migrations applied successfully!" -ForegroundColor Green
        }
        catch {
            Write-Host "  Failed to apply migrations automatically." -ForegroundColor Red
            Write-Host "  Please apply manually via Supabase Dashboard." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  Please apply migrations manually:" -ForegroundColor Yellow
        Write-Host "  1. Go to Supabase Dashboard → SQL Editor" -ForegroundColor Gray
        Write-Host "  2. Run these migrations in order:" -ForegroundColor Gray
        Write-Host "     - supabase/migrations/20260208150000_create_cardinal_memberships.sql" -ForegroundColor Gray
        Write-Host "     - supabase/migrations/20260208151000_fix_revenue_distributions.sql" -ForegroundColor Gray
        Write-Host "     - supabase/migrations/20260208152000_fix_schema_relationships.sql" -ForegroundColor Gray
    }
}
else {
    Write-Host "`nStep 2: Skipping migrations (--SkipMigrations flag set)" -ForegroundColor Yellow
}

# Step 3: Verify Files Created
Write-Host "`nStep 3: Verifying API Routes..." -ForegroundColor Yellow

$RouteChecks = @(
    @{Path = "apps/web/app/api/scan/[wallet]/route.ts"; Name = "Wallet Scan Route"},
    @{Path = "apps/web/app/api/treasury/distribute/route.ts"; Name = "Treasury Distribute Route"}
)

foreach ($Check in $RouteChecks) {
    Write-Host "  Checking $($Check.Name)..." -NoNewline
    if (Test-Path $Check.Path) {
        Write-Host " [EXISTS]" -ForegroundColor Green
    }
    else {
        Write-Host " [MISSING]" -ForegroundColor Red
    }
}

# Step 4: Check Migration Files
Write-Host "`nStep 4: Verifying Migration Files..." -ForegroundColor Yellow

$MigrationChecks = @(
    "supabase/migrations/20260208150000_create_cardinal_memberships.sql",
    "supabase/migrations/20260208151000_fix_revenue_distributions.sql",
    "supabase/migrations/20260208152000_fix_schema_relationships.sql"
)

foreach ($Migration in $MigrationChecks) {
    Write-Host "  Checking $(Split-Path $Migration -Leaf)..." -NoNewline
    if (Test-Path $Migration) {
        Write-Host " [EXISTS]" -ForegroundColor Green
    }
    else {
        Write-Host " [MISSING]" -ForegroundColor Red
    }
}

# Step 5: Run Tests
if (-not $SkipTests) {
    Write-Host "`nStep 5: Running API Tests..." -ForegroundColor Yellow
    Write-Host "  This may take 1-2 minutes...`n" -ForegroundColor Gray

    try {
        & ".\scripts\test-api.ps1"
    }
    catch {
        Write-Host "  Failed to run tests: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "`nStep 5: Skipping tests (--SkipTests flag set)" -ForegroundColor Yellow
}

# Step 6: Summary
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    SUMMARY                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Ensure migrations are applied (see Step 2 above)" -ForegroundColor White
Write-Host "  2. Restart your dev server: npm run dev" -ForegroundColor White
Write-Host "  3. Run tests: .\scripts\test-api.ps1" -ForegroundColor White
Write-Host "  4. Check SOLUTIONS_APPLIED.md for detailed info`n" -ForegroundColor White

Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  • ERRORS_FOUND.md        - Detailed error analysis" -ForegroundColor Gray
Write-Host "  • SOLUTIONS_APPLIED.md   - Solutions and progress" -ForegroundColor Gray
Write-Host "  • scripts/test-database.sql - DB integrity tests`n" -ForegroundColor Gray

Write-Host "Expected Results:" -ForegroundColor Yellow
Write-Host "  • Pass Rate Before: 32%  (12/37 tests)" -ForegroundColor Gray
Write-Host "  • Pass Rate After:  60%+ (22+/37 tests)" -ForegroundColor Green
Write-Host "  • Pass Rate Target: 85%+ with seed data`n" -ForegroundColor Green
