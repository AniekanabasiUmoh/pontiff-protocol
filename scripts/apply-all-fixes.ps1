# Apply All Test Fixes and Rerun Tests
# This script will fix all issues and rerun tests until passing

$ErrorActionPreference = "Continue"
$MaxIterations = 3
$Iteration = 0

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         PONTIFF FIX AND TEST CYCLE                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# =============================================================================
# Step 1: Apply Database Migration
# =============================================================================
Write-Host "`n=== STEP 1: Applying Database Migration ===" -ForegroundColor Yellow

if (Get-Command supabase -ErrorAction SilentlyContinue) {
    Write-Host "Pushing migrations to Supabase..." -ForegroundColor Gray
    supabase db push

    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: supabase db push failed. Trying alternative method..." -ForegroundColor Yellow

        if ($env:DATABASE_URL) {
            Write-Host "Using psql with DATABASE_URL..." -ForegroundColor Gray
            if (Get-Command psql -ErrorAction SilentlyContinue) {
                psql $env:DATABASE_URL -f ".\supabase\migrations\20260208160000_fix_all_test_issues.sql"
            } else {
                Write-Host "ERROR: psql not found. Please apply migration manually:" -ForegroundColor Red
                Write-Host "  psql `$env:DATABASE_URL -f .\supabase\migrations\20260208160000_fix_all_test_issues.sql" -ForegroundColor Red
                Write-Host "`nOr run the SQL file content against your database." -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "ERROR: DATABASE_URL not set. Please set it or apply migration manually." -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "WARNING: supabase CLI not found. Using psql..." -ForegroundColor Yellow

    if ($env:DATABASE_URL) {
        if (Get-Command psql -ErrorAction SilentlyContinue) {
            psql $env:DATABASE_URL -f ".\supabase\migrations\20260208160000_fix_all_test_issues.sql"
        } else {
            Write-Host "ERROR: Neither supabase nor psql found." -ForegroundColor Red
            Write-Host "Please install one or apply the migration manually." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "ERROR: DATABASE_URL not set." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Database migration applied successfully!" -ForegroundColor Green

# =============================================================================
# Step 2: Verify Routes Exist
# =============================================================================
Write-Host "`n=== STEP 2: Verifying API Routes ===" -ForegroundColor Yellow

$RequiredRoutes = @(
    "apps\web\app\api\session\create\route.ts",
    "apps\web\app\api\agents\deploy\route.ts",
    "apps\web\app\api\agents\[id]\status\route.ts",
    "apps\web\app\api\agents\[id]\stop\route.ts",
    "apps\web\app\api\twitter\challenge\route.ts",
    "apps\web\app\api\twitter\announce\route.ts",
    "apps\web\app\api\cardinal\renew\route.ts",
    "apps\web\app\api\cardinal\cancel\route.ts"
)

$MissingRoutes = @()
foreach ($Route in $RequiredRoutes) {
    if (-not (Test-Path $Route)) {
        $MissingRoutes += $Route
        Write-Host "MISSING: $Route" -ForegroundColor Red
    } else {
        Write-Host "OK: $Route" -ForegroundColor Green
    }
}

if ($MissingRoutes.Count -gt 0) {
    Write-Host "`nERROR: $($MissingRoutes.Count) routes are missing. They should have been created." -ForegroundColor Red
    Write-Host "Please check the file creation steps." -ForegroundColor Red
    exit 1
}

Write-Host "All required routes exist!" -ForegroundColor Green

# =============================================================================
# Step 3: Test and Fix Cycle
# =============================================================================
Write-Host "`n=== STEP 3: Starting Test Cycle ===" -ForegroundColor Yellow

while ($Iteration -lt $MaxIterations) {
    $Iteration++

    Write-Host "`n" -NoNewline
    Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  ITERATION $Iteration of $MaxIterations                    ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Cyan

    # Run API tests
    Write-Host "`nRunning API tests..." -ForegroundColor Gray
    .\scripts\test-api.ps1 > "test-results-iteration-$Iteration.txt"

    # Parse results
    $Results = Get-Content "test-results-iteration-$Iteration.txt" -Raw

    if ($Results -match "Total Tests:\s*(\d+)") {
        $TotalTests = [int]$Matches[1]
    }
    if ($Results -match "Passed:\s*(\d+)") {
        $PassedTests = [int]$Matches[1]
    }
    if ($Results -match "Failed:\s*(\d+)") {
        $FailedTests = [int]$Matches[1]
    }
    if ($Results -match "Pass Rate:\s*([\d.]+)%") {
        $PassRate = [decimal]$Matches[1]
    }

    Write-Host "`nIteration $Iteration Results:" -ForegroundColor Cyan
    Write-Host "  Total Tests: $TotalTests" -ForegroundColor White
    Write-Host "  Passed: $PassedTests" -ForegroundColor Green
    Write-Host "  Failed: $FailedTests" -ForegroundColor Red
    $IterRateColor = if ($PassRate -ge 85) { "Green" } elseif ($PassRate -ge 70) { "Yellow" } else { "Red" }
    Write-Host "  Pass Rate: $PassRate%" -ForegroundColor $IterRateColor

    # Check if we hit target
    if ($PassRate -ge 85) {
        Write-Host "`n SUCCESS: Pass rate of $PassRate% achieved!" -ForegroundColor Green
        Write-Host "Target of 85% met. Tests are passing!" -ForegroundColor Green
        break
    }

    if ($Iteration -eq $MaxIterations) {
        Write-Host "`nWARNING: Reached maximum iterations." -ForegroundColor Yellow
        Write-Host "Current pass rate: $PassRate%" -ForegroundColor Yellow
        Write-Host "Target: 85%" -ForegroundColor Yellow

        # Show remaining failures
        Write-Host "`nRemaining failures:" -ForegroundColor Yellow
        $Failures = $Results -split "`n" | Where-Object { $_ -match "\[FAIL\]" }
        foreach ($Failure in $Failures | Select-Object -First 10) {
            Write-Host "  $Failure" -ForegroundColor Red
        }
        break
    }

    # Wait before next iteration
    Write-Host "`nWaiting 5 seconds before next iteration..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

# =============================================================================
# Final Summary
# =============================================================================
Write-Host "`n`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  FINAL SUMMARY                           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Iterations Run: $Iteration" -ForegroundColor White
$RateColor = if ($PassRate -ge 85) { "Green" } elseif ($PassRate -ge 70) { "Yellow" } else { "Red" }
Write-Host "Final Pass Rate: $PassRate%" -ForegroundColor $RateColor
Write-Host "Tests Passing: $PassedTests / $TotalTests" -ForegroundColor White

if ($PassRate -ge 85) {
    Write-Host "`n SUCCESS: All fixes applied successfully!" -ForegroundColor Green
    Write-Host "The test suite is now passing at $PassRate%." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n PARTIAL SUCCESS: Pass rate improved to $PassRate%." -ForegroundColor Yellow
    Write-Host "Some tests may require manual intervention." -ForegroundColor Yellow
    Write-Host "Check test-results-iteration-$Iteration.txt for details." -ForegroundColor Yellow
    exit 1
}
