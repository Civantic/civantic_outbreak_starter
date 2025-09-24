/**
 * Placeholder ETL for CDC outbreaks.
 */
import fs from 'node:fs/promises'

async function run() {
  const sample = [{
    ob_id: 'NM-ABQ-2025-03',
    onset_date: '2025-08-20',
    state: 'NM',
    county: 'Bernalillo',
    pathogen: 'Salmonella',
    food_cat: 'Poultry',
    cases: 12,
    hospitalizations: 3,
    deaths: 0,
    status: 'Investigating',
    url: 'https://example.com'
  }]
  await fs.writeFile('etl/output/outbreaks.json', JSON.stringify(sample, null, 2))
  console.log('Wrote etl/output/outbreaks.json')
}
run().catch(err => { console.error(err); process.exit(1) })
