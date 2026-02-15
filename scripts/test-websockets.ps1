# Pontiff WebSocket Test Script
# Tests real-time features: live game feed, stats ticker, debate updates

param(
    [string]$WsUrl = "ws://localhost:3000",
    [int]$TimeoutSeconds = 30
)

$Global:PassCount = 0
$Global:FailCount = 0

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         PONTIFF WEBSOCKET TEST SUITE              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
Write-Host "WebSocket URL: $WsUrl" -ForegroundColor Gray
Write-Host "Timeout: $TimeoutSeconds seconds`n" -ForegroundColor Gray

# Check if Node.js is available
Write-Host "Checking Node.js availability..." -NoNewline
try {
    $NodeVersion = node --version 2>&1
    Write-Host " [OK] $NodeVersion" -ForegroundColor Green
}
catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "Node.js is required for WebSocket tests. Install from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Create a temporary Node.js test script
$TestScript = @"
const WebSocket = require('ws');

const tests = [
    {
        name: 'Live Game Feed Connection',
        url: '$WsUrl/api/ws/games',
        timeout: $TimeoutSeconds * 1000,
        expectedMessages: ['connection', 'game_update']
    },
    {
        name: 'Stats Ticker Connection',
        url: '$WsUrl/api/ws/stats',
        timeout: $TimeoutSeconds * 1000,
        expectedMessages: ['stats_update']
    },
    {
        name: 'Debate Updates Connection',
        url: '$WsUrl/api/ws/debates',
        timeout: $TimeoutSeconds * 1000,
        expectedMessages: ['debate_update']
    }
];

let passCount = 0;
let failCount = 0;

function testWebSocket(test) {
    return new Promise((resolve) => {
        console.log(\`Testing \${test.name}...\`);

        const ws = new WebSocket(test.url);
        const messages = [];
        let timer;

        ws.on('open', () => {
            console.log(\`  ✓ Connected to \${test.url}\`);
        });

        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data);
                messages.push(parsed);
                console.log(\`  ✓ Received message: \${parsed.type || 'unknown'}\`);
            } catch (e) {
                console.log(\`  ⚠ Received non-JSON message\`);
            }
        });

        ws.on('error', (error) => {
            console.log(\`  ✗ Error: \${error.message}\`);
            failCount++;
            clearTimeout(timer);
            ws.close();
            resolve(false);
        });

        ws.on('close', () => {
            console.log(\`  Connection closed\`);
        });

        // Set timeout
        timer = setTimeout(() => {
            ws.close();
            if (messages.length > 0) {
                console.log(\`  ✓ PASS: Received \${messages.length} message(s)\`);
                passCount++;
                resolve(true);
            } else {
                console.log(\`  ✗ FAIL: No messages received within timeout\`);
                failCount++;
                resolve(false);
            }
        }, test.timeout);
    });
}

async function runTests() {
    console.log('Starting WebSocket tests...\\n');

    for (const test of tests) {
        await testWebSocket(test);
        console.log('');
    }

    console.log('\\n=== WEBSOCKET TEST SUMMARY ===');
    console.log(\`Total Tests: \${passCount + failCount}\`);
    console.log(\`Passed: \${passCount}\`);
    console.log(\`Failed: \${failCount}\`);
    console.log(\`Pass Rate: \${((passCount / (passCount + failCount)) * 100).toFixed(2)}%\`);

    process.exit(failCount > 0 ? 1 : 0);
}

runTests();
"@

# Save the test script
$TempScript = Join-Path $env:TEMP "pontiff-ws-test.js"
$TestScript | Out-File -FilePath $TempScript -Encoding UTF8

Write-Host "Running WebSocket tests...`n" -ForegroundColor Yellow

# Run the Node.js test script
try {
    node $TempScript
    $ExitCode = $LASTEXITCODE

    if ($ExitCode -eq 0) {
        Write-Host "`n✓ All WebSocket tests passed!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Some WebSocket tests failed" -ForegroundColor Red
    }

    exit $ExitCode
}
catch {
    Write-Host "Error running WebSocket tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Cleanup
    Remove-Item $TempScript -ErrorAction SilentlyContinue
}
