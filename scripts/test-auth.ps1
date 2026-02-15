# Pontiff Authentication Test Script
# Tests SIWE (Sign-In With Ethereum) flow and protected endpoints

$BaseUrl = "http://localhost:3000/api"
$TestWallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{}
    )

    Write-Host "Testing $Name..." -NoNewline

    try {
        $Params = @{
            Uri         = "$BaseUrl$Url"
            Method      = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
            Headers     = $Headers
        }

        if ($Body) {
            $Params.Body = ($Body | ConvertTo-Json -Depth 5)
        }

        $Response = Invoke-RestMethod @Params
        Write-Host " [PASS]" -ForegroundColor Green
        return $Response
    }
    catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $Stream = $_.Exception.Response.GetResponseStream()
            $Reader = New-Object System.IO.StreamReader($Stream)
            Write-Host "Response: $($Reader.ReadToEnd())" -ForegroundColor Red
        }
        return $null
    }
}

Write-Host "`n=== AUTHENTICATION & AUTHORIZATION TESTS ===`n" -ForegroundColor Cyan

# Test 1: Get Nonce (should work without auth)
Write-Host "`n--- Test 1: Nonce Generation ---" -ForegroundColor Yellow
$NonceResponse = Test-Endpoint -Name "Get Nonce" -Method "Get" -Url "/auth/nonce?address=$TestWallet"
if ($NonceResponse) {
    Write-Host "Nonce received: $($NonceResponse.nonce)" -ForegroundColor Green
}

# Test 2: Verify Signature (mock signature - expect failure)
Write-Host "`n--- Test 2: Signature Verification ---" -ForegroundColor Yellow
$VerifyBody = @{
    address   = $TestWallet
    signature = "0xmocksignature"
    nonce     = if ($NonceResponse) { $NonceResponse.nonce } else { "mock_nonce" }
}
$VerifyResponse = Test-Endpoint -Name "Verify Signature (Mock)" -Method "Post" -Url "/auth/verify" -Body $VerifyBody

# Test 3: Access /me endpoint without auth (should fail)
Write-Host "`n--- Test 3: Protected Endpoints Without Auth ---" -ForegroundColor Yellow
Test-Endpoint -Name "Get User Profile (No Auth)" -Method "Get" -Url "/auth/me"

# Test 4: Access /me endpoint with invalid token (should fail)
Write-Host "`n--- Test 4: Protected Endpoints With Invalid Token ---" -ForegroundColor Yellow
$InvalidHeaders = @{
    "Authorization" = "Bearer invalid_token_12345"
}
Test-Endpoint -Name "Get User Profile (Invalid Token)" -Method "Get" -Url "/auth/me" -Headers $InvalidHeaders

# Test 5: Test logout
Write-Host "`n--- Test 5: Logout ---" -ForegroundColor Yellow
Test-Endpoint -Name "Logout" -Method "Post" -Url "/auth/logout"

Write-Host "`n=== AUTHENTICATION TESTS COMPLETED ===`n" -ForegroundColor Cyan

Write-Host "NOTE: Full SIWE flow requires actual wallet signature." -ForegroundColor Yellow
Write-Host "Use MetaMask/WalletConnect for integration testing." -ForegroundColor Yellow
