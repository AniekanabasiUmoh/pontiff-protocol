$files = @(
  "apps/web/app/api/debates/active/route.ts",
  "apps/web/app/api/debates/twitter/route.ts",
  "apps/web/app/api/vatican/confess/route.ts",
  "apps/web/app/api/conversions/mint-nft/route.ts",
  "apps/web/app/api/confession/mint-nft/route.ts",
  "apps/web/app/api/confession/stake/route.ts",
  "apps/web/app/api/vatican/buy-indulgence/route.ts",
  "apps/web/app/api/membership/cardinal/route.ts",
  "apps/web/app/api/games/stats/route.ts",
  "apps/web/app/api/games/rps/play/route.ts",
  "apps/web/app/api/confession/recent/route.ts",
  "apps/web/app/api/confession/tweet-roast/route.ts",
  "apps/web/app/api/vatican/crusade/[id]/route.ts",
  "apps/web/app/api/vatican/competitors/route.ts",
  "apps/web/app/api/games/history/route.ts",
  "apps/web/app/api/games/judas/record/route.ts",
  "apps/web/app/api/vatican/conversions/route.ts",
  "apps/web/app/api/vatican/challenge/route.ts"
)
$root = "c:/Dev/Pontiff"
$oldImport = "import { supabase } from '@/lib/db/supabase';"
$newImport = "import { createServerSupabase } from '@/lib/db/supabase-server';"

foreach ($f in $files) {
  $path = "$root/$f"
  if (Test-Path $path) {
    $content = Get-Content $path -Raw -Encoding UTF8
    if ($content -match [regex]::Escape($oldImport)) {
      $content = $content.Replace($oldImport, $newImport)
      Set-Content $path -Value $content -NoNewline -Encoding UTF8
      Write-Host "Fixed import: $f"
    } else {
      Write-Host "Already fixed or not found: $f"
    }
  } else {
    Write-Host "File not found: $path"
  }
}
Write-Host "Done."
