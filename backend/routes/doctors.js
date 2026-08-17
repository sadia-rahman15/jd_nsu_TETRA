const express = require('express');

const SPECIALTY_CODE = {
  Neurologist: 'NEUROLOGY',
  Ophthalmologist: 'OPHTHALMOLOGY',
  'ENT Specialist': 'ENT',
  Orthopedic: 'ORTHOPEDICS',
  Cardiologist: 'CARDIOLOGY',
  Pulmonologist: 'PULMONOLOGY',
  Gastroenterologist: 'GASTROENTEROLOGY',
  'General Physician': 'GENERAL_MEDICINE',
  'General Specialist': 'GENERAL_MEDICINE',
};

const finite = (v) => Number.isFinite(Number(v));
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

module.exports = function createDoctorsRouter(db, authenticateUser) {
  const router = express.Router();

  router.get('/nearby', authenticateUser, async (req, res) => {
    try {
      const specialtyText = String(req.query.specialty || '').trim();
      const specialtyCode =
        SPECIALTY_CODE[specialtyText] ||
        String(req.query.specialtyCode || '').trim().toUpperCase();

      if (!specialtyCode) {
        return res.status(400).json({ message: 'specialty is required.' });
      }

      const latitude = Number(req.query.latitude ?? req.query.lat);
      const longitude = Number(req.query.longitude ?? req.query.lng);
      const hasLocation = finite(latitude) && finite(longitude);
      const requestedRadius = clamp(Number(req.query.radiusKm || 20) || 20, 1, 100);
      const limit = clamp(Number(req.query.limit || 30) || 30, 1, 50);

      const baseSelect = `
        SELECT
          d.id AS doctor_id,
          d.name AS doctor_name,
          d.education_text,
          d.experience_years,
          d.city,
          c.id AS chamber_id,
          c.name AS chamber_name,
          c.area,
          c.address_text,
          c.latitude,
          c.longitude,
          dc.appointment_numbers,
          ais.display_name AS ai_specialty,
          (
            SELECT GROUP_CONCAT(DISTINCT s2.name ORDER BY s2.name SEPARATOR ', ')
            FROM doctor_specialties ds2
            JOIN specialties s2 ON s2.id = ds2.specialty_id
            WHERE ds2.doctor_id = d.id
          ) AS all_specialties,
          (
            SELECT GROUP_CONCAT(DISTINCT con.name ORDER BY con.name SEPARATOR ', ')
            FROM doctor_concentrations dcon
            JOIN concentrations con ON con.id = dcon.concentration_id
            WHERE dcon.doctor_id = d.id
          ) AS concentrations,
          ${hasLocation ? `
          6371 * ACOS(LEAST(1, GREATEST(-1,
            COS(RADIANS(?)) * COS(RADIANS(c.latitude)) *
            COS(RADIANS(c.longitude) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(c.latitude))
          )))` : 'NULL'} AS distance_km
        FROM doctors d
        JOIN doctor_chambers dc ON dc.doctor_id = d.id
        JOIN chambers c ON c.id = dc.chamber_id
        JOIN ai_specialties ais ON ais.code = ?
        WHERE EXISTS (
          SELECT 1
          FROM doctor_specialties ds
          JOIN ai_specialty_map asm ON asm.specialty_id = ds.specialty_id
          WHERE ds.doctor_id = d.id AND asm.ai_code = ?
        )
      `;

      const locationParams = hasLocation ? [latitude, longitude, latitude] : [];
      let rows = [];
      let radiusUsed = requestedRadius;
      let expanded = false;

      if (hasLocation) {
        const [withinRadius] = await db.execute(
          `${baseSelect}
           AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL
           HAVING distance_km <= ?
           ORDER BY distance_km ASC, d.experience_years DESC, d.name ASC
           LIMIT ${limit}`,
          [...locationParams, specialtyCode, specialtyCode, requestedRadius]
        );
        rows = withinRadius;

        // If the requested radius has no match, still keep the user in AmarCure
        // and return the closest Dhaka matches instead of an empty external-search link.
        if (rows.length === 0) {
          expanded = true;
          radiusUsed = null;
          const [nearest] = await db.execute(
            `${baseSelect}
             AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL
             ORDER BY distance_km ASC, d.experience_years DESC, d.name ASC
             LIMIT ${limit}`,
            [...locationParams, specialtyCode, specialtyCode]
          );
          rows = nearest;

          // If chamber geocoding has not been run yet (or all matches failed),
          // still return useful doctor records with distance=null.
          if (rows.length === 0) {
            const [ungGeocoded] = await db.execute(
              `${baseSelect}
               ORDER BY d.experience_years DESC, d.name ASC
               LIMIT ${limit}`,
              [...locationParams, specialtyCode, specialtyCode]
            );
            rows = ungGeocoded;
          }
        }
      } else {
        const [withoutLocation] = await db.execute(
          `${baseSelect}
           ORDER BY d.experience_years DESC, d.name ASC
           LIMIT ${limit}`,
          [specialtyCode, specialtyCode]
        );
        rows = withoutLocation;
      }

      const doctors = rows.map((r) => ({
        id: `${r.doctor_id}-${r.chamber_id}`,
        doctorId: Number(r.doctor_id),
        name: r.doctor_name,
        degree: r.education_text || '',
        specialty: r.ai_specialty,
        specialties: r.all_specialties || '',
        experienceYears: Number(r.experience_years || 0),
        concentrations: r.concentrations || '',
        hospital: r.chamber_name,
        area: r.area || '',
        city: r.city || 'Dhaka',
        address: r.address_text || [r.chamber_name, r.city].filter(Boolean).join(', '),
        appointmentNumbers: r.appointment_numbers || '',
        phone: r.appointment_numbers || null,
        latitude: r.latitude == null ? null : Number(r.latitude),
        longitude: r.longitude == null ? null : Number(r.longitude),
        distanceKm:
          r.distance_km == null ? null : Number(Number(r.distance_km).toFixed(2)),
      }));

      return res.json({
        specialty: specialtyText || specialtyCode,
        specialtyCode,
        requestedRadiusKm: requestedRadius,
        radiusUsedKm: radiusUsed,
        radiusExpanded: expanded,
        locationAvailable: hasLocation,
        count: doctors.length,
        doctors,
      });
    } catch (error) {
      console.error('Nearby doctor search failed:', error);
      return res.status(500).json({ message: 'Unable to search the doctor directory right now.' });
    }
  });

  return router;
};
