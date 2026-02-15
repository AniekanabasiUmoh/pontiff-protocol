$jsonPath = "c:\Dev\Pontiff\final_schema_check.json"

Write-Host "Reading schema from $jsonPath..."
$jsonContent = Get-Content -Path $jsonPath -Raw
$schema = $jsonContent | ConvertFrom-Json

$definitions = $schema.definitions

Write-Host "Checking tables..."

$tablesToCheck = @("competitor_agents", "debates", "tournaments", "cardinal_memberships")

foreach ($table in $tablesToCheck) {
    if ($definitions.PSObject.Properties.Match($table).Count -gt 0) {
        Write-Host "FOUND: $table"
        $props = $definitions.$table.properties
        $cols = $props.PSObject.Properties.Name
        Write-Host "  Columns: $($cols -join ', ')"
    } else {
        Write-Host "MISSING: $table (This is an error if SQL tries to update/insert into it)"
    }
}
