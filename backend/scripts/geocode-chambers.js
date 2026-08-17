require('dotenv').config();
const db = require('../db');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CONTACT = process.env.GEOCODER_CONTACT_EMAIL || '';

const USER_AGENT = CONTACT
  ? `AmarCure/1.0 (${CONTACT})`
  : 'AmarCure/1.0 doctor-chamber-geocoder';

/*
 * Some names in the dataset are different from the names
 * used by OpenStreetMap/Nominatim.
 *
 * These aliases make the search much more reliable.
 */
const SEARCH_ALIASES = {
  'Aalok Healthcare Ltd. | Mirpur 10': [
    'Aalok Healthcare Mirpur 10',
    'Aalok Hospital Mirpur 10',
    'Alok Healthcare Mirpur 10',
  ],

  'BRB Hospitals Limited': [
    'BRB Hospital Dhaka',
    'BRB Hospitals Panthapath',
    'BRB Hospital Panthapath',
  ],

  'Green Life Hospital Ltd.': [
    'Green Life Hospital Dhaka',
    'Green Life Hospital Green Road',
  ],

  'Ibn Sina D. Lab & Consultation Center | Doyagonj': [
    'Ibn Sina Diagnostic Doyaganj',
    'Ibn Sina Diagnostic Center Doyaganj',
    'Ibn Sina D Lab Doyaganj',
  ],

  'Ibn Sina Diagnostic & Consultation Center | Badda': [
    'Ibn Sina Diagnostic Badda',
    'Ibn Sina Diagnostic Center Badda',
  ],

  'Ibn Sina Diagnostic & Consultation Centre | Uttara': [
    'Ibn Sina Diagnostic Uttara',
    'Ibn Sina Diagnostic Center Uttara',
  ],

  'Ibn Sina Diagnostic & Imaging Center | Dhanmondi': [
    'Ibn Sina Diagnostic Dhanmondi',
    'Ibn Sina Diagnostic Imaging Center Dhanmondi',
    'Ibn Sina Dhanmondi',
  ],

  'Ibn Sina Diagnostic Center | Malibag': [
    'Ibn Sina Diagnostic Malibagh',
    'Ibn Sina Diagnostic Center Malibagh',
    'Ibn Sina Malibagh',
  ],

  'Popular Diagnostic Centre Ltd. | Dhanmondi': [
    'Popular Diagnostic Center Dhanmondi',
    'Popular Diagnostic Centre Dhanmondi',
    'Popular Diagnostic Dhanmondi',
  ],

  'Popular Diagnostic Centre Ltd. | Shantinagar (Unit 1)': [
    'Popular Diagnostic Center Shantinagar',
    'Popular Diagnostic Centre Shantinagar',
    'Popular Diagnostic Shantinagar',
  ],

  'Popular Diagnostic Centre Ltd. | Shyamoli': [
    'Popular Diagnostic Center Shyamoli',
    'Popular Diagnostic Centre Shyamoli',
    'Popular Diagnostic Shyamoli',
  ],

  'Popular Diagnostic Centre Ltd. | Uttara (Unit 1)': [
    'Popular Diagnostic Center Uttara',
    'Popular Diagnostic Centre Uttara',
    'Popular Diagnostic Uttara',
  ],

  'Popular Diagnostic Centre Ltd. | English Road': [
    'Popular Diagnostic Center English Road',
    'Popular Diagnostic Centre English Road',
    'Popular Diagnostic Old Dhaka',
  ],

  'Square Hospitals Ltd': [
    'Square Hospital Dhaka',
    'Square Hospital Panthapath',
    'Square Hospitals Panthapath',
  ],

  'Universal Medical College Hospital Limited': [
    'Universal Medical College Hospital Dhaka',
    'Universal Medical College Hospital Mohakhali',
  ],

  'Uttara Crescent Hospital & Diagnostic Center': [
    'Uttara Crescent Hospital Dhaka',
    'Crescent Hospital Uttara',
  ],
};

/*
 * Generate several different search phrases.
 */
function queryVariants(chamber) {
  const variants = [];

  const rawName = String(chamber.name || '').trim();
  const area = String(chamber.area || '').trim();

  if (SEARCH_ALIASES[rawName]) {
    for (const alias of SEARCH_ALIASES[rawName]) {
      variants.push(`${alias}, Dhaka, Bangladesh`);
    }
  }

  variants.push(`${rawName}, Dhaka, Bangladesh`);

  if (area) {
    variants.push(
      `${rawName}, ${area}, Dhaka, Bangladesh`
    );
  }

  /*
   * Remove text after |.
   */
  if (rawName.includes('|')) {
    const base = rawName.split('|')[0].trim();

    variants.push(
      `${base}, ${area}, Dhaka, Bangladesh`
    );

    variants.push(
      `${base}, Dhaka, Bangladesh`
    );
  }

  /*
   * Remove "(Unit 1)" etc.
   */
  const withoutParentheses = rawName
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  variants.push(
    `${withoutParentheses}, Dhaka, Bangladesh`
  );

  /*
   * Normalize Centre → Center.
   */
  variants.push(
    `${withoutParentheses.replace(/Centre/gi, 'Center')}, Dhaka, Bangladesh`
  );

  /*
   * Remove common company words.
   */
  const simplified = withoutParentheses
    .replace(/\bLtd\.?\b/gi, '')
    .replace(/\bLimited\b/gi, '')
    .replace(/\bCentre\b/gi, 'Center')
    .replace(/\s+/g, ' ')
    .trim();

  variants.push(
    `${simplified}, Dhaka, Bangladesh`
  );

  if (area) {
    variants.push(
      `${simplified}, ${area}, Dhaka, Bangladesh`
    );
  }

  return [...new Set(
    variants.filter(Boolean)
  )];
}

async function searchNominatim(q) {
  const url = new URL(
    'https://nominatim.openstreetmap.org/search'
  );

  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'bd');
  url.searchParams.set('addressdetails', '1');

  if (CONTACT) {
    url.searchParams.set('email', CONTACT);
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Nominatim HTTP ${response.status}`
    );
  }

  return response.json();
}

/*
 * Basic result score.
 * Higher score = more likely correct.
 */
function scoreResult(result, chamber) {
  let score = 0;

  const display = String(
    result.display_name || ''
  ).toLowerCase();

  const chamberName = String(
    chamber.name || ''
  ).toLowerCase();

  const area = String(
    chamber.area || ''
  ).toLowerCase();

  if (display.includes('bangladesh')) {
    score += 10;
  }

  if (
    display.includes('dhaka') ||
    display.includes('savar')
  ) {
    score += 10;
  }

  if (
    area &&
    display.includes(area.toLowerCase())
  ) {
    score += 15;
  }

  /*
   * Compare important name words.
   */
  const importantWords = chamberName
    .replace(/[|&.,()]/g, ' ')
    .split(/\s+/)
    .filter(
      (word) =>
        word.length >= 4 &&
        ![
          'hospital',
          'hospitals',
          'limited',
          'centre',
          'center',
          'diagnostic',
          'consultation',
        ].includes(word)
    );

  for (const word of importantWords) {
    if (display.includes(word)) {
      score += 5;
    }
  }

  return score;
}

function chooseBestResult(results, chamber) {
  if (!results || results.length === 0) {
    return null;
  }

  const scored = results
    .map((result) => ({
      result,
      score: scoreResult(result, chamber),
    }))
    .sort((a, b) => b.score - a.score);

  /*
   * Require at least a reasonable Bangladesh/Dhaka match.
   */
  if (scored[0].score < 15) {
    return null;
  }

  return scored[0].result;
}

async function main() {
  const [chambers] = await db.execute(`
    SELECT
      id,
      name,
      area,
      city
    FROM chambers
    WHERE latitude IS NULL
       OR longitude IS NULL
    ORDER BY id
  `);

  console.log(
    `Chambers awaiting coordinates: ${chambers.length}`
  );

  for (const chamber of chambers) {
    console.log(
      `\nSearching: ${chamber.name}`
    );

    let bestMatch = null;

    const variants =
      queryVariants(chamber);

    for (const query of variants) {
      try {
        console.log(
          `  Trying: ${query}`
        );

        const results =
          await searchNominatim(query);

        const candidate =
          chooseBestResult(
            results,
            chamber
          );

        if (candidate) {
          bestMatch = candidate;

          console.log(
            `  Candidate: ${candidate.display_name}`
          );

          break;
        }
      } catch (error) {
        console.warn(
          `  Lookup failed: ${error.message}`
        );
      }

      /*
       * Nominatim public service:
       * stay around <= 1 request per second.
       */
      await sleep(1200);
    }

    if (bestMatch) {
      const latitude =
        Number(bestMatch.lat);

      const longitude =
        Number(bestMatch.lon);

      await db.execute(
        `
        UPDATE chambers
        SET
          latitude = ?,
          longitude = ?,
          geocode_status = 'matched',
          geocode_display_name = ?,
          geocoded_at = NOW()
        WHERE id = ?
        `,
        [
          latitude,
          longitude,
          bestMatch.display_name || null,
          chamber.id,
        ]
      );

      console.log(
        `✓ ${chamber.name}`
      );

      console.log(
        `  -> ${latitude}, ${longitude}`
      );
    } else {
      await db.execute(
        `
        UPDATE chambers
        SET
          geocode_status = 'failed',
          geocoded_at = NOW()
        WHERE id = ?
        `,
        [chamber.id]
      );

      console.log(
        `✗ Still no reliable match: ${chamber.name}`
      );
    }
  }

  const [summary] =
    await db.execute(`
      SELECT
        geocode_status,
        COUNT(*) AS total
      FROM chambers
      GROUP BY geocode_status
    `);

  console.log('\nFinal geocoding summary:');
  console.table(summary);

  const [remaining] =
    await db.execute(`
      SELECT
        id,
        name,
        area
      FROM chambers
      WHERE latitude IS NULL
         OR longitude IS NULL
      ORDER BY name
    `);

  if (remaining.length > 0) {
    console.log(
      '\nStill missing coordinates:'
    );

    console.table(remaining);
  } else {
    console.log(
      '\n✓ Every chamber now has coordinates.'
    );
  }

  await db.end();
}

main().catch(async (error) => {
  console.error(
    'Geocoding script failed:',
    error
  );

  try {
    await db.end();
  } catch {}

  process.exit(1);
});