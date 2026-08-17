const express = require("express");

function clean(value) {
  return String(value || "").trim();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[.,()\-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Canonical thana mapping used by both GPS detection and donor matching.
// Important: neighbourhoods such as Solmaid are converted to the police-thana
// name (Vatara) instead of being shown as the user's thana.
const THANA_RULES = [
  {
    thana: "Vatara",
    aliases: [
      "vatara", "bhatara", "ভাটারা", "solmaid", "bashundhara", "basundhara",
      "bashundhara residential area", "notun bazar", "notunbazar", "sayeed nagar",
      "kuril", "kalachandpur", "nurerchala", "khilbarirtek"
    ],
  },
  {
    thana: "Khilkhet",
    aliases: ["khilkhet", "nikunjo", "nikunjo 2", "নিকুঞ্জ", "নিকুঞ্জ ২"],
  },
  {
    thana: "Badda",
    aliases: ["badda", "aftabnagar", "aftab nagar", "merul badda", "বাড্ডা"],
  },
  {
    thana: "Rampura",
    aliases: ["rampura", "west rampura", "banasree", "bonosree", "বনশ্রী"],
  },
  {
    thana: "Gulshan",
    aliases: ["gulshan", "niketan", "নিকেতন"],
  },
  {
    thana: "Banani",
    aliases: ["banani", "mohakhali", "মহাখালী"],
  },
  {
    thana: "Uttara East",
    aliases: [
      "uttara sector 1", "uttara sector 2", "uttara sector 4", "uttara sector 6",
      "uttara sector 8", "sector 1 uttara", "sector 2 uttara", "sector 4 uttara",
      "sector 6 uttara", "sector 8 uttara"
    ],
  },
  {
    thana: "Uttara West",
    aliases: [
      "uttara sector 3", "uttara sector 5", "uttara sector 7", "uttara sector 9",
      "uttara sector 10", "uttara sector 11", "uttara sector 12", "uttara sector 13",
      "uttara sector 14", "sector 3 uttara", "sector 5 uttara", "sector 7 uttara",
      "sector 9 uttara", "sector 10 uttara", "sector 11 uttara", "sector 12 uttara",
      "sector 13 uttara", "sector 14 uttara", "house building", "housebuilding",
      "kamarpara", "abdullahpur"
    ],
  },
  {
    thana: "Turag",
    aliases: [
      "turag", "sector 15", "sector 16", "sector 17", "sector 18", "diabari",
      "ruap", "উওরা ১৮", "উত্তরা ১৮", "তুরাগ"
    ],
  },
  {
    thana: "Dakshinkhan",
    aliases: ["dakshinkhan", "dakkhinkhan", "kawla", "কাওলা", "দক্ষিনখান", "দক্ষিণখান"],
  },
  {
    thana: "Uttarkhan",
    aliases: ["uttarkhan", "uttar khan", "masterpara", "উত্তরখান"],
  },
  {
    thana: "Airport",
    aliases: ["kurmitola", "kurmitola", "কুর্মিটোলা", "airport thana"],
  },
  {
    thana: "Pallabi",
    aliases: [
      "pallabi", "mirpur 11", "mirpur 12", "mirpur dohs", "mirpur 6",
      "পল্লবী", "মিরপুর ১১", "মিরপুর ১২"
    ],
  },
  {
    thana: "Mirpur Model",
    aliases: ["mirpur 2", "mirpur model"],
  },
  {
    thana: "Darus Salam",
    aliases: ["darussalam", "darus salam", "mizar road", "mazar road"],
  },
  {
    thana: "Kafrul",
    aliases: ["kazipara", "shewrapara", "shewra para", "কাজীপাড়া", "শেওড়াপাড়া"],
  },
  {
    thana: "Mohammadpur",
    aliases: ["mohammadpur", "mohammodpur", "dhaka uddan", "mohammadia housing", "chaad uddan"],
  },
  {
    thana: "Sher-e-Bangla Nagar",
    aliases: ["agargaon", "sher e bangla nagar", "sherebangla nagar"],
  },
  {
    thana: "Tejgaon",
    aliases: ["tejgaon", "farmgate", "framgate", "nakhalpara", "rajabazaar", "rajabazar"],
  },
  {
    thana: "Dhanmondi",
    aliases: ["dhanmondi", "green road", "kathalbagan", "panthapath", "পান্থপথ"],
  },
  {
    thana: "Hazaribagh",
    aliases: ["hazaribag", "hazaribagh"],
  },
  {
    thana: "Shahbag",
    aliases: ["shahbag", "shahbagh", "poribagh", "dhaka medical", "bakshibazar"],
  },
  {
    thana: "Ramna",
    aliases: ["shantinagar", "শান্তিনগর"],
  },
  {
    thana: "Paltan",
    aliases: ["paltan", "polton"],
  },
  {
    thana: "Shahjahanpur",
    aliases: ["shahjahanpur", "shajahanpur"],
  },
  {
    thana: "Khilgaon",
    aliases: ["khilgaon", "খিলগাঁও"],
  },
  {
    thana: "Sabujbag",
    aliases: ["bashabo", "basabo", "sabujbag"],
  },
  {
    thana: "Wari",
    aliases: ["wari", "ticatuli", "টিকাটুলি"],
  },
  {
    thana: "Jatrabari",
    aliases: ["jatrabari", "kazla", "shonir akhra", "শনির আখড়া"],
  },
  {
    thana: "Demra",
    aliases: ["demra", "damra", "konapara"],
  },
  {
    thana: "Savar",
    aliases: ["savar", "সাভার", "khagan", "খাগান"],
  },
  {
    thana: "Ashulia",
    aliases: ["ashulia", "ashuliya", "আশুলিয়া", "আশুলিয়া", "daffodil international university"],
  },
  {
    thana: "Narayanganj Sadar",
    aliases: ["narayanganj", "নারায়ণগঞ্জ", "নারায়ণগঞ্জ"],
  },
  {
    thana: "Gazipur Sadar",
    aliases: ["gazipur sadar", "joydebpur", "duet", "boardbazar", "iut"],
  },
  {
    thana: "Tongi",
    aliases: ["tongi", "tonggi", "টংগী", "modhumita tongi"],
  },
  {
    thana: "Kaliakair",
    aliases: ["kaliakair"],
  },
  {
    thana: "Kaliganj",
    aliases: ["kaligonj", "kaliganj"],
  },
  {
    thana: "Kapasia",
    aliases: ["kapasia"],
  },
  {
    thana: "Feni Sadar",
    aliases: ["feni"],
  },
  {
    thana: "Tangail Sadar",
    aliases: ["tangail"],
  },
  {
    thana: "Kushtia Sadar",
    aliases: ["kushtia sadar", "kushtia"],
  },
  {
    thana: "Chattogram Pahartali",
    aliases: ["pahatoli", "pahartali", "d t road"],
  },
  {
    thana: "Chapai Nawabganj Sadar",
    aliases: ["chapai nawabganj sadar", "chapai nawabganj"],
  },
  {
    thana: "Bagerhat Sadar",
    aliases: ["bagerhat", "বাগেরহাট"],
  },
];

function mapTextToThana(value) {
  const text = normalize(value);
  if (!text) return "";

  for (const rule of THANA_RULES) {
    for (const alias of rule.aliases) {
      if (text.includes(normalize(alias))) {
        return rule.thana;
      }
    }
  }

  return "";
}

async function reverseGeocode(latitude, longitude) {
  const url =
    "https://nominatim.openstreetmap.org/reverse" +
    "?format=jsonv2" +
    "&lat=" + encodeURIComponent(latitude) +
    "&lon=" + encodeURIComponent(longitude) +
    "&zoom=18" +
    "&addressdetails=1" +
    "&accept-language=en";

  const response = await fetch(url, {
    headers: {
      "User-Agent": "AmarCure-BloodSearch/2.0",
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new Error("Reverse geocoder HTTP " + response.status);
  }

  return response.json();
}

function detectThanaFromReverse(reverse) {
  const address = reverse && reverse.address ? reverse.address : {};

  // First match the complete local address against our canonical thana map.
  // This is what fixes cases such as Solmaid -> Vatara.
  const combined = [
    address.city_district,
    address.suburb,
    address.neighbourhood,
    address.quarter,
    address.residential,
    address.village,
    address.town,
    address.municipality,
    address.road,
    reverse && reverse.display_name,
  ]
    .filter(Boolean)
    .join(" | ");

  const mapped = mapTextToThana(combined);
  if (mapped) return mapped;

  // If OSM explicitly returns something named as a thana, use it.
  const explicitCandidates = [
    address.city_district,
    address.municipality,
    address.county,
  ];

  for (const candidate of explicitCandidates) {
    const value = clean(candidate);
    if (/\b(thana|upazila)\b/i.test(value)) {
      return value
        .replace(/\b(thana|upazila)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return "";
}

async function detectThana(latitude, longitude) {
  const reverse = await reverseGeocode(latitude, longitude);
  return {
    thana: detectThanaFromReverse(reverse),
    rawDisplayName: clean(reverse && reverse.display_name),
  };
}

function validateCoordinates(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

module.exports = function createBloodDonorRouter(db, authenticateUser) {
  const router = express.Router();

  router.get("/detect-thana", authenticateUser, async function (req, res) {
    try {
      const latitude = Number(req.query.latitude);
      const longitude = Number(req.query.longitude);

      if (!validateCoordinates(latitude, longitude)) {
        return res.status(400).json({ error: "Valid latitude and longitude are required." });
      }

      const detected = await detectThana(latitude, longitude);

      if (!detected.thana) {
        return res.status(422).json({
          error: "Your GPS position was found, but AmarCure could not confidently map it to a thana.",
          rawLocation: detected.rawDisplayName,
        });
      }

      return res.status(200).json({
        latitude,
        longitude,
        thana: detected.thana,
      });
    } catch (error) {
      console.error("Thana detection failed:", error);
      return res.status(500).json({ error: "Could not determine your thana right now." });
    }
  });

  router.get("/search", authenticateUser, async function (req, res) {
    try {
      const bloodGroup = clean(req.query.bloodGroup).toUpperCase();
      const validGroups = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

      if (!validGroups.has(bloodGroup)) {
        return res.status(400).json({ error: "Please select a valid blood group." });
      }

      const latitude = Number(req.query.latitude);
      const longitude = Number(req.query.longitude);

      if (!validateCoordinates(latitude, longitude)) {
        return res.status(400).json({ error: "Valid latitude and longitude are required." });
      }

      // Never trust a neighbourhood name sent by the frontend. Recalculate the
      // canonical thana on the backend from GPS every time.
      const detected = await detectThana(latitude, longitude);
      const thana = detected.thana;

      if (!thana) {
        return res.status(422).json({
          error: "Could not confidently determine your thana from the detected GPS location.",
        });
      }

      const sql = `
        SELECT
          id,
          donor_name,
          blood_group_normalized,
          phone_normalized,
          phone_raw,
          location_text,
          source_name,
          source_url
        FROM public_blood_donors
        WHERE blood_group_normalized = ?
          AND location_text = ?
        ORDER BY
          CASE WHEN phone_normalized IS NULL THEN 1 ELSE 0 END,
          donor_name ASC
        LIMIT 250
      `;

      const [rows] = await db.execute(sql, [bloodGroup, thana]);

      const donors = rows.map((row) => ({
        id: Number(row.id),
        name: row.donor_name,
        bloodGroup: row.blood_group_normalized,
        phone: row.phone_normalized || row.phone_raw || null,
        location: row.location_text || "",
        sourceName: row.source_name || null,
        sourceUrl: row.source_url || null,
        availability: "CALL_TO_CONFIRM",
      }));

      return res.status(200).json({
        bloodGroup,
        thana,
        centerDisplayName: `${thana} Thana`,
        count: donors.length,
        results: donors,
      });
    } catch (error) {
      console.error("Blood donor search failed:", error);
      return res.status(500).json({ error: "Could not search blood donors right now." });
    }
  });

  return router;
};
