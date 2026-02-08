$files = Get-ChildItem -Path "apps/web" -Recurse -Include "*.ts"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    $content = $content -replace "\.from\('Game'\)", ".from('games')"
    $content = $content -replace "\.from\('Leaderboard'\)", ".from('leaderboard_entries')"
    $content = $content -replace "\.from\('WorldEvent'\)", ".from('world_events')"
    $content = $content -replace "\.from\('Crusade'\)", ".from('crusades')"
    $content = $content -replace "\.from\('CompetitorAgent'\)", ".from('competitor_agents')"
    $content = $content -replace "\.from\('Conversion'\)", ".from('conversions')"
    $content = $content -replace "\.from\('Debate'\)", ".from('debates')"
    $content = $content -replace "\.from\('VaticanEntrant'\)", ".from('vatican_entrants')"
    $content = $content -replace "\.from\('Confession'\)", ".from('confessions')"
    
    # Also handle double quotes just in case
    $content = $content -replace '\.from\("Game"\)', '.from("games")'
    $content = $content -replace '\.from\("Leaderboard"\)', '.from("leaderboard_entries")'
    $content = $content -replace '\.from\("WorldEvent"\)', '.from("world_events")'
    $content = $content -replace '\.from\("Crusade"\)', '.from("crusades")'
    $content = $content -replace '\.from\("CompetitorAgent"\)', '.from("competitor_agents")'
    $content = $content -replace '\.from\("Conversion"\)', '.from("conversions")'
    $content = $content -replace '\.from\("Debate"\)', '.from("debates")'
    $content = $content -replace '\.from\("VaticanEntrant"\)', '.from("vatican_entrants")'
    $content = $content -replace '\.from\("Confession"\)', '.from("confessions")'

    if ($content -ne $originalContent) {
        Write-Host "Updating $($file.FullName)"
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}
Write-Host "Table name fix complete."
