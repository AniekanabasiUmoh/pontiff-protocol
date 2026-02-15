# Pontiff - Run All Test Suites
# Orchestrator script to run all 6 test suites sequentially or in parallel

param(
    [switch]$Fast,        # Skip slow tests (E2E, WebSocket)
    [switch]$Parallel,    # Run tests in parallel (requires background jobs support)
    [switch]$SkipContracts, # Skip contract tests
    [switch]$CI           # CI mode (fail-fast, minimal output)
)

$ErrorActionPreference = "Continue"
$Global:TotalTests = 0
$Global:TotalPassed = 0
$Global:TotalFailed = 0

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         PONTIFF COMPLETE TEST SUITE                     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($Fast) {
    Write-Host "FAST MODE: Skipping slow tests E2E and WebSocket" -ForegroundColor Yellow
}
if ($Parallel) {
    Write-Host "PARALLEL MODE: Running tests concurrently" -ForegroundColor Yellow
}
if ($CI) {
    Write-Host "CI MODE: Fail-fast enabled" -ForegroundColor Yellow
}

Write-Host "`nStarting test execution at $(Get-Date -Format 'HH:mm:ss')`n" -ForegroundColor Gray

$Results = @{}

function Run-TestSuite {
    param(
        [string]$Name,
        [string]$Command,
        [switch]$Required
    )

    Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Name" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

    $StartTime = Get-Date

    try {
        Invoke-Expression $Command
        $ExitCode = $LASTEXITCODE

        $Duration = ((Get-Date) - $StartTime).TotalSeconds

        if ($ExitCode -eq 0 -or $null -eq $ExitCode) {
            $DurationSec = $Duration.ToString() + "s"
            Write-Host "`nPASS: $Name ($DurationSec)" -ForegroundColor Green
            $Results[$Name] = @{ Status = "PASS"; Duration = $Duration; ExitCode = 0 }
            return $true
        } else {
            $DurationSec = $Duration.ToString() + "s"
            Write-Host "`nFAIL: $Name ($DurationSec)" -ForegroundColor Red
            $Results[$Name] = @{ Status = "FAIL"; Duration = $Duration; ExitCode = $ExitCode }

            if ($CI -and $Required) {
                Write-Host "CI MODE: Stopping due to required test failure" -ForegroundColor Red
                exit $ExitCode
            }

            return $false
        }
    }
    catch {
        $Duration = ((Get-Date) - $StartTime).TotalSeconds
        $DurationSec = $Duration.ToString() + "s"
        Write-Host "`nERROR: $Name - $($_.Exception.Message) ($DurationSec)" -ForegroundColor Red
        $Results[$Name] = @{ Status = "ERROR"; Duration = $Duration; Error = $_.Exception.Message }

        if ($CI -and $Required) {
            exit 1
        }

        return $false
    }
}

# =============================================================================
# Test Suite 1: API Tests (REQUIRED)
# =============================================================================
Run-TestSuite -Name "API Tests" -Command ".\scripts\test-api.ps1" -Required

# =============================================================================
# Test Suite 2: Authentication Tests (REQUIRED)
# =============================================================================
Run-TestSuite -Name "Authentication Tests" -Command ".\scripts\test-auth.ps1" -Required

# =============================================================================
# Test Suite 3: Database Integrity Tests
# =============================================================================
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Run-TestSuite -Name "Database Tests" -Command "psql `$env:DATABASE_URL -f .\scripts\test-database.sql"
} else {
    Write-Host "`nWARNING: Skipping Database Tests: psql not found" -ForegroundColor Yellow
    $Results["Database Tests"] = @{ Status = "SKIP"; Reason = "psql not available" }
}

# =============================================================================
# Test Suite 4: WebSocket Tests (OPTIONAL - Skip in Fast mode)
# =============================================================================
if (-not $Fast) {
    Run-TestSuite -Name "WebSocket Tests" -Command ".\scripts\test-websockets.ps1"
} else {
    Write-Host "`nSKIPPING: WebSocket Tests (Fast mode)" -ForegroundColor Yellow
    $Results["WebSocket Tests"] = @{ Status = "SKIP"; Reason = "Fast mode" }
}

# =============================================================================
# Test Suite 5: E2E Frontend Tests (OPTIONAL - Skip in Fast mode)
# =============================================================================
if (-not $Fast) {
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        Run-TestSuite -Name "E2E Tests" -Command "npx playwright test tests/e2e"
    } else {
        Write-Host "`nWARNING: Skipping E2E Tests: Node.js/npx not found" -ForegroundColor Yellow
        $Results["E2E Tests"] = @{ Status = "SKIP"; Reason = "npx not available" }
    }
} else {
    Write-Host "`nSKIPPING: E2E Tests (Fast mode)" -ForegroundColor Yellow
    $Results["E2E Tests"] = @{ Status = "SKIP"; Reason = "Fast mode" }
}

# =============================================================================
# Test Suite 6: Smart Contract Tests (OPTIONAL)
# =============================================================================
if (-not $SkipContracts) {
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        Run-TestSuite -Name "Contract Tests" -Command "npx hardhat test tests/contracts"
    } else {
        Write-Host "`nWARNING: Skipping Contract Tests: Hardhat not found" -ForegroundColor Yellow
        $Results["Contract Tests"] = @{ Status = "SKIP"; Reason = "Hardhat not available" }
    }
} else {
    Write-Host "`nSKIPPING: Contract Tests (SkipContracts flag)" -ForegroundColor Yellow
    $Results["Contract Tests"] = @{ Status = "SKIP"; Reason = "Skipped by flag" }
}

# =============================================================================
# SUMMARY
# =============================================================================
Write-Host "`n`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  TEST SUITE SUMMARY                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$TotalPassed = ($Results.Values | Where-Object { $_.Status -eq "PASS" }).Count
$TotalFailed = ($Results.Values | Where-Object { $_.Status -eq "FAIL" -or $_.Status -eq "ERROR" }).Count
$TotalSkipped = ($Results.Values | Where-Object { $_.Status -eq "SKIP" }).Count
$TotalTests = $Results.Count

$TotalDuration = ($Results.Values | Where-Object { $_.Duration } | Measure-Object -Property Duration -Sum).Sum

Write-Host "Test Suites Run: $TotalTests" -ForegroundColor White
Write-Host "Passed:          $TotalPassed" -ForegroundColor Green
Write-Host "Failed:          $TotalFailed" -ForegroundColor Red
Write-Host "Skipped:         $TotalSkipped" -ForegroundColor Yellow
Write-Host "Total Duration:  $([math]::Round($TotalDuration, 2))s`n" -ForegroundColor White

# Detailed Results
Write-Host "Detailed Results:" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

foreach ($Test in $Results.GetEnumerator() | Sort-Object Name) {
    $Name = $Test.Key
    $Result = $Test.Value

    switch ($Result.Status) {
        "PASS" {
            $Color = "Green"
            $Icon = "PASS"
            $Duration = [math]::Round($Result.Duration, 2)
            $Detail = "${Duration}s"
        }
        "FAIL" {
            $Color = "Red"
            $Icon = "FAIL"
            $Detail = "Exit code: $($Result.ExitCode)"
        }
        "ERROR" {
            $Color = "Red"
            $Icon = "ERROR"
            $Detail = $Result.Error
        }
        "SKIP" {
            $Color = "Yellow"
            $Icon = "SKIP"
            $Detail = $Result.Reason
        }
    }

    Write-Host "  $Icon " -NoNewline -ForegroundColor $Color
    Write-Host "$Name" -NoNewline -ForegroundColor White
    Write-Host " - $Detail" -ForegroundColor Gray
}

Write-Host "`n"

# Exit with appropriate code
if ($TotalFailed -gt 0) {
    Write-Host "FAILED: Some tests failed. Review the output above." -ForegroundColor Red
    exit 1
} elseif ($TotalPassed -eq 0) {
    Write-Host "WARNING: No tests passed. Check your configuration." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "SUCCESS: All tests passed!" -ForegroundColor Green
    exit 0
}
