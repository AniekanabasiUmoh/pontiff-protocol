# Comprehensive Pontiff API Test Suite
# Includes all API tests + additional validation checks
# Usage: .\scripts\test-comprehensive.ps1

param(
    [string]$BaseUrl = "http://localhost:3000/api",
    [string]$Wallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
)

$Global:PassCount = 0
$Global:FailCount = 0
$Global:TestResults = @()

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Body = $null,
        [string]$ExpectedStatus = "200",
        [string]$Category = "General"
    )

    Write-Host "Testing $Name..." -NoNewline

    $TestStart = Get-Date
    try {
        $Params = @{
            Uri         = "$BaseUrl$Url"
            Method      = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }

        if ($Body) {
            $Params.Body = ($Body | ConvertTo-Json -Depth 5)
        }

        $Response = Invoke-RestMethod @Params
        $Duration = ((Get-Date) - $TestStart).TotalMilliseconds

        Write-Host " [PASS] (${Duration}ms)" -ForegroundColor Green
        $Global:PassCount++
        $Global:TestResults += @{
            Test = $Name
            Category = $Category
            Status = "PASS"
            Duration = $Duration
            Response = $Response
        }
        return $Response
    }
    catch {
        $Duration = ((Get-Date) - $TestStart).TotalMilliseconds
        $StatusCode = $_.Exception.Response.StatusCode.value__

        # Check if this is an expected failure
        if ($ExpectedStatus -eq "400" -and $StatusCode -eq 400) {
            Write-Host " [EXPECTED FAIL] (${Duration}ms)" -ForegroundColor Yellow
            $Global:PassCount++
            $Global:TestResults += @{
                Test = $Name
                Category = $Category
                Status = "EXPECTED_FAIL"
                Duration = $Duration
                Error = $_.Exception.Message
            }
            return $null
        }

        Write-Host " [FAIL] ($StatusCode) (${Duration}ms)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red

        if ($_.Exception.Response) {
            $Stream = $_.Exception.Response.GetResponseStream()
            $Reader = New-Object System.IO.StreamReader($Stream)
            $ErrorBody = $Reader.ReadToEnd()
            if ($ErrorBody.Length -lt 500) {
                Write-Host "  Response: $ErrorBody" -ForegroundColor Red
            }
        }

        $Global:FailCount++
        $Global:TestResults += @{
            Test = $Name
            Category = $Category
            Status = "FAIL"
            Duration = $Duration
            Error = $_.Exception.Message
            StatusCode = $StatusCode
        }
        return $null
    }
}

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PONTIFF COMPREHENSIVE API TEST SUITE           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Test Wallet: $Wallet`n" -ForegroundColor Gray

# =============================================================================
# CATEGORY 1: CORE VATICAN OPERATIONS
# =============================================================================
Write-Host "`n=== Category 1: Core Vatican Operations ===" -ForegroundColor Yellow

$ConfessBody = @{
    agentWallet = $Wallet
    signature   = "mock_sig"
    timestamp   = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
}
Test-Endpoint -Name "Confess Sins" -Method "Post" -Url "/vatican/confess" -Body $ConfessBody -Category "Vatican"

$IndulgenceBody = @{
    type        = "buyIndulgence"
    agentWallet = $Wallet
    tier        = "Minor"
    signature   = "mock_sig"
    timestamp   = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
}
Test-Endpoint -Name "Buy Indulgence" -Method "Post" -Url "/vatican/buy-indulgence" -Body $IndulgenceBody -Category "Vatican"

Test-Endpoint -Name "Vatican State" -Method "Get" -Url "/vatican/state" -Category "Vatican"
Test-Endpoint -Name "Vatican Dashboard" -Method "Get" -Url "/vatican/dashboard" -Category "Vatican"

# =============================================================================
# CATEGORY 2: WALLET andPROFILE SCANNING
# =============================================================================
Write-Host "`n=== Category 2: Wallet and Profile Scanning ===" -ForegroundColor Yellow

Test-Endpoint -Name "Scan Wallet Profile" -Method "Get" -Url "/scan/$Wallet" -Category "Profile"

# =============================================================================
# CATEGORY 3: LEADERBOARDS
# =============================================================================
Write-Host "`n=== Category 3: Leaderboards ===" -ForegroundColor Yellow

Test-Endpoint -Name "Leaderboard: Shame" -Method "Get" -Url "/leaderboard/shame" -Category "Leaderboard"
Test-Endpoint -Name "Leaderboard: Saints" -Method "Get" -Url "/leaderboard/saints" -Category "Leaderboard"
Test-Endpoint -Name "Leaderboard: Heretics" -Method "Get" -Url "/leaderboard/heretics" -Category "Leaderboard"

# =============================================================================
# CATEGORY 4: GAME HISTORY andANALYTICS
# =============================================================================
Write-Host "`n=== Category 4: Game History andAnalytics ===" -ForegroundColor Yellow

Test-Endpoint -Name "Game History" -Method "Get" -Url "/games/history" -Category "Analytics"
Test-Endpoint -Name "Game Statistics" -Method "Get" -Url "/games/stats" -Category "Analytics"
Test-Endpoint -Name "Revenue Analytics" -Method "Get" -Url "/analytics/revenue" -Category "Analytics"

# =============================================================================
# CATEGORY 5: COMPETITORS andDEBATES
# =============================================================================
Write-Host "`n=== Category 5: Competitors andDebates ===" -ForegroundColor Yellow

Test-Endpoint -Name "Competitor Agents" -Method "Get" -Url "/vatican/competitors" -Category "Competitors"
Test-Endpoint -Name "All Debates" -Method "Get" -Url "/vatican/debates" -Category "Debates"
Test-Endpoint -Name "Competitor Scan Cron Job" -Method "Get" -Url "/cron/scan" -Category "Competitors"

$DebateBody = @{ debateId = 1 }
Test-Endpoint -Name "Judge Debate" -Method "Post" -Url "/debates/judge" -Body $DebateBody -Category "Debates" -ExpectedStatus "404"

# =============================================================================
# CATEGORY 6: TREASURY andREVENUE
# =============================================================================
Write-Host "`n=== Category 6: Treasury andRevenue ===" -ForegroundColor Yellow

Test-Endpoint -Name "Treasury Distribution History" -Method "Get" -Url "/treasury/distribute" -Category "Treasury"
Test-Endpoint -Name "Distribute Revenue" -Method "Post" -Url "/treasury/distribute" -Category "Treasury"

# =============================================================================
# CATEGORY 7: CONFESSION SYSTEM
# =============================================================================
Write-Host "`n=== Category 7: Confession System ===" -ForegroundColor Yellow

$StakeBody = @{
    walletAddress = $Wallet
    stakeAmount   = "100000000000000000000"  # 100 GUILT (18 decimals)
    txHash        = "0xmock_tx_hash_$(Get-Random)"
}
Test-Endpoint -Name "Stake Penance" -Method "Post" -Url "/confession/stake" -Body $StakeBody -Category "Confession"

$RoastBody = @{
    walletAddress = $Wallet
    roast         = "You are a degenerate gambler who needs redemption."
    sinScore      = 100
    optInPublic   = $true
}
Test-Endpoint -Name "Tweet Roast Mock" -Method "Post" -Url "/confession/tweet-roast" -Body $RoastBody -Category "Confession"

# =============================================================================
# CATEGORY 8: CARDINAL MEMBERSHIP
# =============================================================================
Write-Host "`n=== Category 8: Cardinal Membership ===" -ForegroundColor Yellow

$CardinalBody = @{
    action        = "subscribe"
    walletAddress = $Wallet
}
Test-Endpoint -Name "Subscribe Cardinal" -Method "Post" -Url "/membership/cardinal" -Body $CardinalBody -Category "Membership"
Test-Endpoint -Name "Get Membership Status" -Method "Get" -Url "/membership/cardinal?address=$Wallet" -Category "Membership"

# =============================================================================
# CATEGORY 9: TOURNAMENTS
# =============================================================================
Write-Host "`n=== Category 9: Tournaments ===" -ForegroundColor Yellow

$TourneyBody = @{
    name      = "Test Tournament $(Get-Date -Format 'yyyyMMdd_HHmmss')"
    entryFee  = "100"
    prizePool = "1000"
    startDate = [DateTimeOffset]::Now.AddDays(1).ToUnixTimeSeconds()
    endDate   = [DateTimeOffset]::Now.AddDays(8).ToUnixTimeSeconds()
    maxParticipants = 16
}
Test-Endpoint -Name "Create Tournament" -Method "Post" -Url "/tournaments/create" -Body $TourneyBody -Category "Tournament"
Test-Endpoint -Name "List Tournaments" -Method "Get" -Url "/tournaments/list" -Category "Tournament"

# =============================================================================
# CATEGORY 10: NFT MINTING
# =============================================================================
Write-Host "`n=== Category 10: NFT Minting ===" -ForegroundColor Yellow

$NftBody = @{
    conversionId     = 1
    recipientAddress = $Wallet
    severity         = 1
}
Test-Endpoint -Name "Mint Conversion NFT" -Method "Post" -Url "/conversions/mint-nft" -Body $NftBody -Category "NFT" -ExpectedStatus "404"

$ConfessionNftBody = @{
    confessionId     = 1
    recipientAddress = $Wallet
}
Test-Endpoint -Name "Mint Confession NFT" -Method "Post" -Url "/confession/mint-nft" -Body $ConfessionNftBody -Category "NFT" -ExpectedStatus "404"

# =============================================================================
# CATEGORY 11: AGENT MANAGEMENT
# =============================================================================
Write-Host "`n=== Category 11: Agent Management ===" -ForegroundColor Yellow

$RegisterBody = @{
    agentWallet = $Wallet
    agentName   = "TestBot_$([DateTimeOffset]::Now.ToUnixTimeSeconds())"
    strategy    = "berzerker"
}
Test-Endpoint -Name "Register Agent" -Method "Post" -Url "/agents/register" -Body $RegisterBody -Category "Agents"
Test-Endpoint -Name "Agent Status" -Method "Get" -Url "/agents/status?wallet=$Wallet" -Category "Agents"

# =============================================================================
# CATEGORY 12: ERROR HANDLING andVALIDATION
# =============================================================================
Write-Host "`n=== Category 12: Error Handling andValidation ===" -ForegroundColor Yellow

# Test with invalid wallet
Test-Endpoint -Name "Invalid Wallet Format" -Method "Get" -Url "/scan/invalid_wallet" -Category "Validation" -ExpectedStatus "400"

# Test with missing required fields
$InvalidConfess = @{
    agentWallet = $Wallet
    # Missing signature and timestamp
}
Test-Endpoint -Name "Missing Required Fields" -Method "Post" -Url "/vatican/confess" -Body $InvalidConfess -Category "Validation" -ExpectedStatus "400"

# =============================================================================
# TEST SUMMARY
# =============================================================================
Write-Host "`n`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║               TEST SUMMARY                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$TotalTests = $Global:PassCount + $Global:FailCount
$PassRate = if ($TotalTests -gt 0) { [math]::Round(($Global:PassCount / $TotalTests) * 100, 2) } else { 0 }

Write-Host "`nTotal Tests: $TotalTests" -ForegroundColor White
Write-Host "Passed:      $Global:PassCount" -ForegroundColor Green
Write-Host "Failed:      $Global:FailCount" -ForegroundColor Red
Write-Host "Pass Rate:   $PassRate%`n" -ForegroundColor $(if ($PassRate -ge 80) { "Green" } elseif ($PassRate -ge 50) { "Yellow" } else { "Red" })

# Group results by category
$ByCategory = $Global:TestResults | Group-Object -Property Category
Write-Host "`n--- Results by Category ---`n" -ForegroundColor Cyan
foreach ($Category in $ByCategory) {
    $CategoryPass = ($Category.Group | Where-Object { $_.Status -eq "PASS" -or $_.Status -eq "EXPECTED_FAIL" }).Count
    $CategoryTotal = $Category.Count
    $CategoryRate = [math]::Round(($CategoryPass / $CategoryTotal) * 100, 2)

    $Color = if ($CategoryRate -ge 80) { "Green" } elseif ($CategoryRate -ge 50) { "Yellow" } else { "Red" }
    Write-Host "$($Category.Name): $CategoryPass/$CategoryTotal ($CategoryRate%)" -ForegroundColor $Color
}

# Show failed tests
if ($Global:FailCount -gt 0) {
    Write-Host "`n--- Failed Tests ---`n" -ForegroundColor Red
    $FailedTests = $Global:TestResults | Where-Object { $_.Status -eq "FAIL" }
    foreach ($Test in $FailedTests) {
        Write-Host "  • $($Test.Test)" -ForegroundColor Red
        Write-Host "    Error: $($Test.Error)" -ForegroundColor DarkRed
        if ($Test.StatusCode) {
            Write-Host "    Status Code: $($Test.StatusCode)" -ForegroundColor DarkRed
        }
    }
}

Write-Host "`n"

# Exit with appropriate code
exit $Global:FailCount
