-- AmarCure blood donor location cleanup
-- Purpose: replace free-text donor locations with ONLY a canonical thana name.
-- A safety copy is created first so the cleanup can be reversed.

START TRANSACTION;

DROP TABLE IF EXISTS public_blood_donors_before_thana_cleanup;
CREATE TABLE public_blood_donors_before_thana_cleanup LIKE public_blood_donors;
INSERT INTO public_blood_donors_before_thana_cleanup
SELECT * FROM public_blood_donors;

UPDATE public_blood_donors
SET location_text = CASE
  /* -------------------- VATARA / EAST DHAKA -------------------- */
  WHEN LOWER(location_text) LIKE '%vatara%'
    OR LOWER(location_text) LIKE '%bhatara%'
    OR LOWER(location_text) LIKE '%solmaid%'
    OR LOWER(location_text) LIKE '%bashundhara%'
    OR LOWER(location_text) LIKE '%basundhara%'
    OR LOWER(location_text) LIKE '%notun bazar%'
    OR LOWER(location_text) LIKE '%sayeed nagar%'
    OR LOWER(location_text) LIKE '%kuril%'
    THEN 'Vatara'

  WHEN LOWER(location_text) LIKE '%khilkhet%'
    OR LOWER(location_text) LIKE '%nikunjo%'
    OR location_text LIKE '%নিকুঞ্জ%'
    THEN 'Khilkhet'

  WHEN LOWER(location_text) LIKE '%aftabnagar%'
    OR LOWER(location_text) LIKE '%aftab nagar%'
    OR LOWER(location_text) LIKE '%badda%'
    OR location_text LIKE '%বাড্ডা%'
    THEN 'Badda'

  WHEN LOWER(location_text) LIKE '%rampura%'
    OR LOWER(location_text) LIKE '%banasree%'
    OR LOWER(location_text) LIKE '%bonosree%'
    THEN 'Rampura'

  WHEN LOWER(location_text) LIKE '%niketan%'
    OR LOWER(location_text) LIKE '%gulshan%'
    OR location_text LIKE '%নিকেতন%'
    THEN 'Gulshan'

  WHEN LOWER(location_text) LIKE '%banani%'
    OR LOWER(location_text) LIKE '%mohakhali%'
    THEN 'Banani'

  /* -------------------- UTTARA -------------------- */
  WHEN LOWER(location_text) LIKE '%sector 18%'
    OR LOWER(location_text) LIKE '%sector-18%'
    OR LOWER(location_text) LIKE '%sector 17%'
    OR LOWER(location_text) LIKE '%sector-17%'
    OR LOWER(location_text) LIKE '%sector 16%'
    OR LOWER(location_text) LIKE '%sector-16%'
    OR LOWER(location_text) LIKE '%sector 15%'
    OR LOWER(location_text) LIKE '%sector-15%'
    OR LOWER(location_text) LIKE '%diabari%'
    OR LOWER(location_text) LIKE '%ruap%'
    OR LOWER(location_text) LIKE '%turag%'
    OR location_text LIKE '%তুরাগ%'
    THEN 'Turag'

  WHEN LOWER(location_text) LIKE '%sector 3%'
    OR LOWER(location_text) LIKE '%sector-3%'
    OR LOWER(location_text) LIKE '%sector 5%'
    OR LOWER(location_text) LIKE '%sector -5%'
    OR LOWER(location_text) LIKE '%sector-5%'
    OR LOWER(location_text) LIKE '%sector 7%'
    OR LOWER(location_text) LIKE '%sector-7%'
    OR LOWER(location_text) LIKE '%sector 9%'
    OR LOWER(location_text) LIKE '%sector-9%'
    OR LOWER(location_text) LIKE '%sector 10%'
    OR LOWER(location_text) LIKE '%sector-10%'
    OR LOWER(location_text) LIKE '%sector 11%'
    OR LOWER(location_text) LIKE '%sector-11%'
    OR LOWER(location_text) LIKE '%sector 12%'
    OR LOWER(location_text) LIKE '%sector-12%'
    OR LOWER(location_text) LIKE '%sector 13%'
    OR LOWER(location_text) LIKE '%sector-13%'
    OR LOWER(location_text) LIKE '%sector 14%'
    OR LOWER(location_text) LIKE '%sector-14%'
    OR LOWER(location_text) LIKE '%housebuilding%'
    OR LOWER(location_text) LIKE '%house building%'
    OR LOWER(location_text) LIKE '%kamarpara%'
    THEN 'Uttara West'

  WHEN LOWER(location_text) LIKE '%sector 1%'
    OR LOWER(location_text) LIKE '%sector-1%'
    OR LOWER(location_text) LIKE '%sector 2%'
    OR LOWER(location_text) LIKE '%sector-2%'
    OR LOWER(location_text) LIKE '%sector 4%'
    OR LOWER(location_text) LIKE '%sector-4%'
    OR LOWER(location_text) LIKE '%sector 6%'
    OR LOWER(location_text) LIKE '%sector -6%'
    OR LOWER(location_text) LIKE '%sector-6%'
    OR LOWER(location_text) LIKE '%sector 8%'
    OR LOWER(location_text) LIKE '%sector-8%'
    THEN 'Uttara East'

  WHEN LOWER(location_text) LIKE '%uttarkhan%'
    OR LOWER(location_text) LIKE '%uttar khan%'
    OR LOWER(location_text) LIKE '%masterpara%'
    THEN 'Uttarkhan'

  WHEN LOWER(location_text) LIKE '%dakshinkhan%'
    OR LOWER(location_text) LIKE '%dakkhinkhan%'
    OR LOWER(location_text) LIKE '%kawla%'
    OR location_text LIKE '%কাওলা%'
    OR location_text LIKE '%দক্ষিনখান%'
    OR location_text LIKE '%দক্ষিণখান%'
    THEN 'Dakshinkhan'

  WHEN LOWER(location_text) LIKE '%kurmitola%'
    OR location_text LIKE '%কুর্মিটোলা%'
    THEN 'Airport'

  -- Uttara rows without a sector cannot be split reliably East/West.
  -- House Building is treated as Uttara West; generic Uttara is kept as Uttara West
  -- for this imported list because most such entries cluster around House Building / western sectors.
  WHEN LOWER(location_text) LIKE '%uttara%'
    OR location_text LIKE '%উত্তরা%'
    THEN 'Uttara West'

  /* -------------------- MIRPUR -------------------- */
  WHEN LOWER(location_text) LIKE '%pallabi%'
    OR LOWER(location_text) LIKE '%mirpur 11%'
    OR LOWER(location_text) LIKE '%mirpur-11%'
    OR LOWER(location_text) LIKE '%mirpur 12%'
    OR LOWER(location_text) LIKE '%mirpur -12%'
    OR LOWER(location_text) LIKE '%mirpur-12%'
    OR LOWER(location_text) LIKE '%mirpur dohs%'
    OR LOWER(location_text) LIKE '%mirpur 6%'
    OR LOWER(location_text) LIKE '%mirpur-6%'
    OR location_text LIKE '%মিরপুর ১২%'
    THEN 'Pallabi'

  WHEN LOWER(location_text) LIKE '%darussalam%'
    OR LOWER(location_text) LIKE '%darus salam%'
    OR LOWER(location_text) LIKE '%mazar road%'
    THEN 'Darus Salam'

  WHEN LOWER(location_text) LIKE '%kazipara%'
    OR LOWER(location_text) LIKE '%shewrapara%'
    OR LOWER(location_text) LIKE '%shewra para%'
    THEN 'Kafrul'

  WHEN LOWER(location_text) LIKE '%mirpur 2%'
    OR LOWER(location_text) LIKE '%mirpur -2%'
    OR LOWER(location_text) LIKE '%mirpur-2%'
    THEN 'Mirpur Model'

  -- The imported source often says only "Mirpur" or "Mirpur-1".
  -- Those strings do not uniquely identify a police thana, so they are grouped
  -- under Mirpur Model for consistent searching rather than keeping free text.
  WHEN LOWER(location_text) LIKE '%mirpur%'
    OR LOWER(location_text) LIKE '%mipur%'
    OR location_text LIKE '%মিরপুর%'
    THEN 'Mirpur Model'

  /* -------------------- CENTRAL / SOUTH DHAKA -------------------- */
  WHEN LOWER(location_text) LIKE '%mohammadpur%'
    OR LOWER(location_text) LIKE '%mohammodpur%'
    OR LOWER(location_text) LIKE '%dhaka uddan%'
    OR LOWER(location_text) LIKE '%mohammadia housing%'
    OR LOWER(location_text) LIKE '%chaad uddan%'
    THEN 'Mohammadpur'

  WHEN LOWER(location_text) LIKE '%agargaon%'
    THEN 'Sher-e-Bangla Nagar'

  WHEN LOWER(location_text) LIKE '%tejgaon%'
    OR LOWER(location_text) LIKE '%farmgate%'
    OR LOWER(location_text) LIKE '%framgate%'
    OR LOWER(location_text) LIKE '%nakhalpara%'
    OR LOWER(location_text) LIKE '%rajabazaar%'
    OR LOWER(location_text) LIKE '%rajabazar%'
    OR LOWER(location_text) LIKE '%karwanbazar%'
    OR LOWER(location_text) LIKE '%kawran bazar%'
    THEN 'Tejgaon'

  WHEN LOWER(location_text) LIKE '%dhanmondi%'
    OR LOWER(location_text) LIKE '%green road%'
    OR LOWER(location_text) LIKE '%kathalbagan%'
    OR LOWER(location_text) LIKE '%panthapath%'
    OR location_text LIKE '%পান্থপথ%'
    THEN 'Dhanmondi'

  WHEN LOWER(location_text) LIKE '%hazaribag%'
    OR LOWER(location_text) LIKE '%hazaribagh%'
    THEN 'Hazaribagh'

  WHEN LOWER(location_text) LIKE '%shahbag%'
    OR LOWER(location_text) LIKE '%poribagh%'
    OR LOWER(location_text) LIKE '%dhaka medical%'
    OR LOWER(location_text) LIKE '%bakshibazar%'
    THEN 'Shahbag'

  WHEN LOWER(location_text) LIKE '%shantinagar%'
    OR location_text LIKE '%শান্তিনগর%'
    THEN 'Ramna'

  WHEN LOWER(location_text) LIKE '%paltan%'
    OR LOWER(location_text) LIKE '%polton%'
    THEN 'Paltan'

  WHEN LOWER(location_text) LIKE '%shahjahanpur%'
    OR LOWER(location_text) LIKE '%shajahanpur%'
    THEN 'Shahjahanpur'

  WHEN LOWER(location_text) LIKE '%khilgaon%'
    THEN 'Khilgaon'

  WHEN LOWER(location_text) LIKE '%bashabo%'
    OR LOWER(location_text) LIKE '%basabo%'
    THEN 'Sabujbag'

  WHEN LOWER(location_text) LIKE '%wari%'
    OR LOWER(location_text) LIKE '%ticatuli%'
    THEN 'Wari'

  WHEN LOWER(location_text) LIKE '%jatrabari%'
    OR LOWER(location_text) LIKE '%kazla%'
    OR LOWER(location_text) LIKE '%shonir akhra%'
    THEN 'Jatrabari'

  WHEN LOWER(location_text) LIKE '%demra%'
    OR LOWER(location_text) LIKE '%damra%'
    OR LOWER(location_text) LIKE '%konapara%'
    THEN 'Demra'

  /* -------------------- OUTSIDE CENTRAL DHAKA -------------------- */
  WHEN LOWER(location_text) LIKE '%ashulia%'
    OR LOWER(location_text) LIKE '%ashuliya%'
    OR location_text LIKE '%আশুলিয়া%'
    OR location_text LIKE '%আশুলিয়া%'
    OR LOWER(location_text) LIKE '%daffodil international university%'
    THEN 'Ashulia'

  WHEN LOWER(location_text) LIKE '%savar%'
    OR location_text LIKE '%সাভার%'
    OR LOWER(location_text) LIKE '%khagan%'
    THEN 'Savar'

  WHEN LOWER(location_text) LIKE '%narayanganj%'
    OR location_text LIKE '%নারায়ণগঞ্জ%'
    OR location_text LIKE '%নারায়ণগঞ্জ%'
    THEN 'Narayanganj Sadar'

  WHEN LOWER(location_text) LIKE '%kaliakair%'
    THEN 'Kaliakair'

  WHEN LOWER(location_text) LIKE '%kaligonj%'
    OR LOWER(location_text) LIKE '%kaliganj%'
    THEN 'Kaliganj'

  WHEN LOWER(location_text) LIKE '%kapasia%'
    THEN 'Kapasia'

  WHEN LOWER(location_text) LIKE '%tongi%'
    OR location_text LIKE '%টংগী%'
    THEN 'Tongi'

  WHEN LOWER(location_text) LIKE '%gazipur%'
    OR LOWER(location_text) LIKE '%joydebpur%'
    OR LOWER(location_text) LIKE '%duet%'
    OR LOWER(location_text) LIKE '%boardbazar%'
    OR LOWER(location_text) LIKE '%iut%'
    OR location_text LIKE '%গাজীপুর%'
    THEN 'Gazipur Sadar'

  WHEN LOWER(location_text) LIKE '%feni%'
    THEN 'Feni Sadar'

  WHEN LOWER(location_text) LIKE '%tangail%'
    THEN 'Tangail Sadar'

  WHEN LOWER(location_text) LIKE '%kushtia%'
    THEN 'Kushtia Sadar'

  WHEN LOWER(location_text) LIKE '%pahatoli%'
    OR LOWER(location_text) LIKE '%pahartali%'
    OR LOWER(location_text) LIKE '%chottogram%'
    OR LOWER(location_text) LIKE '%chattogram%'
    THEN 'Chattogram Pahartali'

  WHEN LOWER(location_text) LIKE '%chapai nawabganj%'
    THEN 'Chapai Nawabganj Sadar'

  WHEN LOWER(location_text) LIKE '%bagerhat%'
    OR location_text LIKE '%বাগেরহাট%'
    THEN 'Bagerhat Sadar'

  -- Too vague to infer a thana safely.
  WHEN location_text IS NULL
    OR TRIM(location_text) = ''
    OR LOWER(TRIM(location_text)) IN ('dhaka', 'unknown')
    THEN 'Unknown'

  ELSE 'Unknown'
END;

COMMIT;

-- Verification: every remaining location should now be a short canonical thana name.
SELECT location_text AS thana, COUNT(*) AS donor_count
FROM public_blood_donors
GROUP BY location_text
ORDER BY donor_count DESC, thana ASC;
