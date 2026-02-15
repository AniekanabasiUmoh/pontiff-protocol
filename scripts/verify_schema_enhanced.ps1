$jsonPath = "c:\Dev\Pontiff\final_schema_check.json"
Write-Host "Reading schema..."
$jsonContent = Get-Content -Path $jsonPath -Raw
$schema = $jsonContent | ConvertFrom-Json
$defs = $schema.definitions

function Check-Table($tableName) {
    Write-Host "----------------------------------------"
    Write-Host "TABLE: $tableName"
    if ($defs.PSObject.Properties.Match($tableName).Count -eq 0) {
        Write-Host "  STATUS: MISSING!"
        return
    }
    
    $props = $defs.$tableName.properties
    $cols = $props.PSObject.Properties.Name | Sort-Object
    
    Write-Host "  STATUS: FOUND"
    Write-Host "  COLUMNS: $($cols.Count)"
    
    # Specific checks for critical columns
    if ($tableName -eq "cardinal_memberships") {
        Write-Host "  > Checking cardinal_memberships columns:"
        $targets = @("last_renewed_at", "lastRenewedAt", "cancelled_at", "cancelledAt", "wallet_address", "walletAddress")
        foreach ($t in $targets) {
            if ($cols -contains $t) { Write-Host "    [YES] $t" } else { Write-Host "    [NO]  $t" }
        }
    }
    
    if ($tableName -eq "competitor_agents") {
        Write-Host "  > Checking competitor_agents columns:"
        $targets = @("twitter_handle", "narrative", "verification_method")
        foreach ($t in $targets) {
             if ($cols -contains $t) { Write-Host "    [YES] $t" } else { Write-Host "    [NO]  $t" }
        }
    }
    
    if ($tableName -eq "debates") {
        Write-Host "  > Checking debates columns:"
        $targets = @("winner_wallet", "status")
        foreach ($t in $targets) {
             if ($cols -contains $t) { Write-Host "    [YES] $t" } else { Write-Host "    [NO]  $t" }
        }
    }
}

Check-Table "cardinal_memberships"
Check-Table "competitor_agents"
Check-Table "debates"
Check-Table "tournaments"
Check-Table "tournament_registrations"
