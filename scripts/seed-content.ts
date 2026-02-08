/**
 * Content Seeding Script
 * Pre-generate roasts for famous wallets before launch
 */

import { scanWallet } from '../apps/api/src/services/scanner';
import { generateRoast } from '../apps/api/src/services/roaster';
import { generateWritImage } from '../apps/api/src/services/imageGenerator';
import { storeConfession } from '../apps/api/src/utils/database';

// Famous crypto wallets to pre-scan
const FAMOUS_WALLETS = [
  { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', name: 'Vitalik Buterin' },
  { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', name: 'Ansem' },
  { address: '0x28C6c06298d514Db089934071355E5743bf21d60', name: 'Binance Hot Wallet' },
  { address: '0x220866B1A2219f40e72f5c628B65D54268cA3A9D', name: 'CZ' },
  { address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', name: 'Justin Sun' },
  { address: '0x1111111254fb6c44bAC0beD2854e76F90643097d', name: '1inch Aggregator' },
  { address: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', name: '0x Protocol' },
  { address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', name: 'Uniswap Universal Router' },
];

interface SeedResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Main seeding function
 */
async function seedContent(): Promise<SeedResult> {
  console.log('🌱 Starting content seeding...\n');

  const result: SeedResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const { address, name } of FAMOUS_WALLETS) {
    try {
      console.log(`\n📊 Scanning ${name} (${address})...`);

      // 1. Scan wallet
      const scanResult = await scanWallet(address);

      if (scanResult.sins.length === 0) {
        console.log(`  ✅ ${name} is clean (no sins found)`);
        continue;
      }

      console.log(`  🔥 Found ${scanResult.sins.length} sins!`);

      // 2. Generate roast
      const primarySin = scanResult.sins[0];
      const roast = await generateRoast({
        type: primarySin.type,
        severity: primarySin.severity,
        lossUSD: primarySin.lossUSD,
        tokenSymbol: primarySin.tokenSymbol,
        description: primarySin.description,
      });

      console.log(`  💬 Roast: "${roast}"`);

      // 3. Generate writ image
      const confessionId = `seed_${Date.now()}_${address.slice(2, 8)}`;
      const imageData = await generateWritImage(roast, address, confessionId);

      console.log(`  🖼️  Image generated`);

      // 4. Store in database
      await storeConfession({
        walletAddress: address,
        sins: scanResult.sins,
        roastText: roast,
        writImageData: imageData,
        confessionId,
      });

      console.log(`  ✅ Stored confession ${confessionId}`);

      result.success++;

      // Rate limit: wait 2 seconds between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ❌ Failed to process ${name}:`, error);
      result.failed++;
      result.errors.push(`${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Print summary
 */
function printSummary(result: SeedResult): void {
  console.log('\n\n═══════════════════════════════════════');
  console.log('📊 CONTENT SEEDING SUMMARY');
  console.log('═══════════════════════════════════════\n');

  console.log(`✅ Successful: ${result.success}`);
  console.log(`❌ Failed: ${result.failed}`);
  console.log(`📈 Total processed: ${result.success + result.failed}`);

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }

  console.log('\n═══════════════════════════════════════\n');
}

/**
 * Run seeding
 */
if (require.main === module) {
  seedContent()
    .then((result) => {
      printSummary(result);

      if (result.failed > 0) {
        console.log('⚠️  Some seeds failed, but continuing...');
        process.exit(0); // Don't fail deployment
      } else {
        console.log('✅ All seeds successful!');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedContent, SeedResult };
