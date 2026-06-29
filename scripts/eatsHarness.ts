/**
 * Dev harness: validate the Eats + combined + reputation pipeline against a real
 * Uber export. Assembles the loose CSVs into an in-memory zip, runs the real
 * parseUberExport + buildAllInsights, and logs the headline numbers so we can
 * eyeball them against the known reference figures.
 *
 *   npx tsx scripts/eatsHarness.ts ["/path/to/Uber Data"]
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
import { parseUberExport } from '../src/lib/parse/index';
import { buildAllInsights } from '../src/lib/insights/index';

const ROOT = process.argv[2] ?? '/Users/skylerluk/Downloads/Uber Data';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.toLowerCase().endsWith('.csv')) out.push(p);
  }
  return out;
}

function money(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

async function main() {
  if (!existsSync(ROOT)) {
    console.error(`No export found at ${ROOT}`);
    process.exit(1);
  }

  // Build a zip mirroring the export's relative layout.
  const zip = new JSZip();
  for (const file of walk(ROOT)) {
    const rel = file.slice(ROOT.length + 1);
    zip.file(rel, readFileSync(file));
  }
  const buffer = await zip.generateAsync({ type: 'arraybuffer' });

  const outcome = await parseUberExport(buffer);
  if (!outcome.ok) {
    console.error('Parse failed:', outcome.code, outcome.message);
    process.exit(1);
  }

  const { completedTrips, eatsOrders, reputation } = outcome.result;
  const all = buildAllInsights(outcome.result.allTrips, completedTrips, {
    eatsOrders,
    reputation,
  });
  const allTime = all.byTimeframe.get('all')!;
  const { stats, eats, combined } = allTime;

  console.log('\n=== TOP ROASTS (deterministic, ranked) ===');
  for (const r of allTime.roasts.slice(0, 14)) {
    console.log(`  [${r.funScore.toFixed(0)}|${r.category}] ${r.headline}`);
    console.log(`        ${r.sub}`);
  }

  console.log('\n=== RIDES ===');
  console.log('Completed rides:', stats.totalRides);
  console.log('Rides spend:', money(stats.totalSpend));

  console.log('\n=== EATS ===');
  if (!eats) {
    console.log('No Eats data found.');
  } else {
    console.log('Orders (completed):', eats.orderCount, '| canceled:', eats.canceledOrders);
    console.log('Items:', eats.itemCount);
    console.log('Eats spend:', money(eats.totalSpend), '| avg order:', money(eats.avgOrder));
    console.log('Date range:', eats.dateRange.label);
    console.log('Top restaurants:', eats.topRestaurants.map((r) => `${r.name} (${r.orders})`).join(', '));
    console.log('Most-ordered item:', eats.mostOrderedItem);
    console.log('Most expensive order:', eats.mostExpensiveOrder);
    console.log('Most expensive item:', eats.mostExpensiveItem);
    console.log('Late-night orders:', eats.lateNightOrders, '| favorite hour:', eats.favoriteHour);
    console.log('Busiest day:', eats.busiestDayOfWeek, '| busiest month:', eats.busiestMonth);
    console.log('Customization spend:', money(eats.totalCustomizationSpend));
    console.log('Orders w/ instructions:', eats.ordersWithInstructions);
    console.log('Sample instructions:', eats.specialInstructionSamples.slice(0, 3));
    console.log('Avg delivery (min):', (eats.avgDeliverySeconds / 60).toFixed(1));
  }

  console.log('\n=== COMBINED ===');
  if (combined) {
    console.log('TOTAL TO UBER:', money(combined.totalToUber));
    console.log('Rides:', money(combined.ridesSpend), '| Eats:', money(combined.eatsSpend));
    console.log('Food vs rides:', combined.foodVsRidesPct, '%');
    console.log('Interactions:', combined.totalInteractions);
  }

  console.log('\n=== REPUTATION ===');
  console.log('Rating:', reputation?.rating);
  console.log('Distribution:', reputation?.distribution);
  console.log('1-star:', reputation?.oneStar, '| total ratings:', reputation?.totalRatings);

  console.log('\n=== YEARS ===', all.years.join(', '));
}

main();
