# For each file, add `const supabase = createServerSupabase();` as first line
# inside each export async function handler body.
# Pattern: find `export async function GET(` or `POST(` or `DELETE(` etc.
# and add the const after the first `{` of that function's try block or directly after the opening brace.

$root = "c:/Dev/Pontiff"

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
  "apps/web/app/api/vatican/competitors/route.ts",
  "apps/web/app/api/games/history/route.ts",
  "apps/web/app/api/games/judas/record/route.ts",
  "apps/web/app/api/vatican/conversions/route.ts",
  "apps/web/app/api/vatican/challenge/route.ts"
)

foreach ($f in $files) {
  $path = "$root/$f"
  if (-not (Test-Path $path)) { Write-Host "NOT FOUND: $f"; continue }

  $content = Get-Content $path -Raw -Encoding UTF8

  # Skip if already has the instantiation
  if ($content -match "const supabase = createServerSupabase\(\)") {
    Write-Host "Already done: $f"
    continue
  }

  # Add after `export const dynamic = 'force-dynamic';` line if present,
  # otherwise we'll do it per-handler insertion
  # Strategy: insert after the first `export async function` opening brace + newline
  # Pattern: find `export async function XYZ(...) {` or `export async function XYZ(...)\n{`

  # We'll insert `    const supabase = createServerSupabase();` as the first line
  # inside the first try block (after `try {`)
  # since most routes wrap everything in try/catch

  $newContent = $content -replace "(export async function \w+[^{]+\{[\r\n]+)([\s]*try \{[\r\n]+)", {
    $match = $args[0]
    $full = $match.Value
    $prefix = $match.Groups[1].Value
    $tryPart = $match.Groups[2].Value
    # Get indentation of the try line
    if ($tryPart -match "^([ \t]*)try") {
      $indent = $matches[1]
      $inner_indent = $indent + "    "
    } else {
      $inner_indent = "    "
    }
    "${prefix}${tryPart}${inner_indent}const supabase = createServerSupabase();`n"
  }

  if ($newContent -ne $content) {
    Set-Content $path -Value $newContent -NoNewline -Encoding UTF8
    Write-Host "Fixed (try-block): $f"
  } else {
    Write-Host "Pattern not matched: $f (needs manual fix)"
  }
}

Write-Host "Done."
