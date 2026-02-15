$root = "c:\Dev\Pontiff"
$archiveLogs = "$root\docs\archive\logs"
$archiveSql = "$root\docs\archive\sql"

# Create archive dirs
New-Item -ItemType Directory -Force -Path $archiveLogs | Out-Null
New-Item -ItemType Directory -Force -Path $archiveSql | Out-Null

# Files to keep in root
$keep = @(
    "package.json", "turbo.json", "yarn.lock", "package-lock.json",
    "IMPLEMENTATION.md", "PONTIFF_AUDIT_REPORT.md", "PROJECT_STATUS.md",
    "BUG_FIXES_SUMMARY.md", "AGENT_SESSIONS_FIX.md", "README.md",
    ".gitignore", ".npmrc", "tsconfig.json", "playwright.config.ts",
    "Pontiff.code-workspace", "PUSH_TO_GITHUB.sh", "nul"
)

# Move .txt, .json output files to archive/logs
$logExts = @(".txt", ".log")
$sqlExts = @(".sql", ".sh")

Get-ChildItem -Path $root -File | Where-Object {
    $_.Name -notin $keep
} | ForEach-Object {
    $dest = $null
    if ($_.Extension -in $logExts -or $_.Extension -eq ".json" -or $_.Extension -eq ".md") {
        $dest = "$archiveLogs\$($_.Name)"
    } elseif ($_.Extension -in $sqlExts) {
        $dest = "$archiveSql\$($_.Name)"
    }

    if ($dest) {
        Move-Item -Path $_.FullName -Destination $dest -Force
        Write-Host "Moved: $($_.Name) -> $dest"
    } else {
        Write-Host "Skipped: $($_.Name) (unknown type: $($_.Extension))"
    }
}

Write-Host "Root cleanup done."
