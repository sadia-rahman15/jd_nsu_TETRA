require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CONTACT = process.env.GEOCODER_CONTACT_EMAIL || '';
const USER_AGENT = CONTACT
  ? `AmarCure/1.0 (${CONTACT})`
  : 'AmarCure/1.0 doctor-directory-setup';

function dbOptions(extra = {}) {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amarcure_db',
    charset: 'utf8mb4',
    ...extra,
  };
}

function queryVariants(chamber) {
  const raw = chamber.name;
  const area = chamber.area || '';
  const variants = [`${raw}, Dhaka, Bangladesh`];
  if (raw.includes('|')) {
    variants.push(`${raw.split('|')[0].trim()}, ${area}, Dhaka, Bangladesh`);
  }
  variants.push(`${raw.replace(/\([^)]*\)/g, '').trim()}, Dhaka, Bangladesh`);
  return [...new Set(variants)];
}

async function nominatim(q) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '3');
  url.searchParams.set('countrycodes', 'bd');
  if (CONTACT) url.searchParams.set('email', CONTACT);
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });
  if (!response.ok) throw new Error(`Geocoder HTTP ${response.status}`);
  return response.json();
}

async function main() {
  console.log('1/2 Importing AmarCure doctor directory...');
  const installer = await mysql.createConnection(dbOptions({ multipleStatements: true }));
  const sqlPath = path.join(__dirname, '..', 'database', 'amarcure_doctor_directory.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await installer.query(sql);
  await installer.end();
  console.log('Doctor database imported successfully.');

  console.log('2/2 Geocoding the 21 chamber/hospital locations...');
  const db = await mysql.createConnection(dbOptions());
  const [chambers] = await db.execute(
    `SELECT id, name, area FROM chambers ORDER BY id`
  );

  for (const chamber of chambers) {
    let match = null;
    for (const q of queryVariants(chamber)) {
      try {
        const results = await nominatim(q);
        match = results.find((r) =>
          /bangladesh/i.test(r.display_name || '') && /(dhaka|savar)/i.test(r.display_name || '')
        ) || results[0] || null;
      } catch (error) {
        console.warn(`Geocoder warning for ${chamber.name}: ${error.message}`);
      }
      await sleep(1100);
      if (match) break;
    }

    if (match) {
      await db.execute(
        `UPDATE chambers SET latitude=?, longitude=?, geocode_status='matched',
         geocode_display_name=?, geocoded_at=NOW() WHERE id=?`,
        [Number(match.lat), Number(match.lon), match.display_name || null, chamber.id]
      );
      console.log(`  ✓ ${chamber.name}`);
    } else {
      await db.execute(
        `UPDATE chambers SET geocode_status='failed', geocoded_at=NOW() WHERE id=?`,
        [chamber.id]
      );
      console.log(`  ! ${chamber.name}: no automatic coordinate match`);
    }
  }

  const [[counts]] = await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM doctors) AS doctors,
      (SELECT COUNT(*) FROM doctor_specialties) AS doctor_specialties,
      (SELECT COUNT(*) FROM chambers) AS chambers,
      (SELECT COUNT(*) FROM chambers WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS geocoded_chambers
  `);
  console.log('\nSetup complete:', counts);
  console.log('If any chamber failed geocoding, the doctor still appears; only its distance is unavailable until coordinates are added.');
  await db.end();
}

main().catch((error) => {
  console.error('\nDoctor-directory setup failed:', error);
  process.exit(1);
});
