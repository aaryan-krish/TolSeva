/**
 * Inspector auto-assignment utility based on:
 * 1. Straight-line (haversine) distance from inspector base location to vendor location
 * 2. Availability (no overlapping CONFIRMED appointment on requested date/time)
 */

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates straight-line distance in kilometers between two lat/lng coordinates
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return Infinity;
  }
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return Infinity;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(nLat2 - nLat1);
  const dLon = toRad(nLon2 - nLon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) * Math.cos(toRad(nLat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if two appointment slots overlap
 */
function isSlotOverlapping(appDate, appTime, reqDate, reqTime) {
  if (!appDate || !reqDate) return false;
  const d1 = String(appDate).split('T')[0];
  const d2 = String(reqDate).split('T')[0];
  if (d1 !== d2) return false;

  // If dates match and either has no time specified (whole-day booking), consider overlapping
  if (!appTime || !reqTime) return true;

  // Normalized comparison for morning/afternoon or specific times
  const t1 = String(appTime).trim().toUpperCase();
  const t2 = String(reqTime).trim().toUpperCase();
  return t1 === t2;
}

/**
 * Automatically find the nearest free inspector for a vendor appointment.
 * 
 * @param {Object} params
 * @param {Array} params.inspectors List of inspector records
 * @param {Array} params.appointments List of existing appointment records
 * @param {number} params.vendorLatitude
 * @param {number} params.vendorLongitude
 * @param {string} params.preferredDate
 * @param {string} params.preferredTime
 * @returns {Object|null} { inspector, distanceKm } or null if none available
 */
function findNearestAvailableInspector({
  inspectors = [],
  appointments = [],
  vendorLatitude,
  vendorLongitude,
  preferredDate,
  preferredTime
}) {
  if (vendorLatitude == null || vendorLongitude == null) {
    return null;
  }

  // 1. Fetch active inspectors with valid base coordinates
  const activeInspectors = inspectors.filter(ins => {
    if (ins.is_active === false) return false;
    const baseLat = ins.baseLatitude ?? ins.base_latitude;
    const baseLng = ins.baseLongitude ?? ins.base_longitude;
    return baseLat != null && baseLng != null;
  });

  if (activeInspectors.length === 0) return null;

  // 2. Identify busy inspector IDs (those with CONFIRMED appointments overlapping date/time)
  const busyInspectorIds = new Set();
  for (const app of appointments) {
    const status = String(app.status || '').toUpperCase();
    if (status !== 'CONFIRMED') continue;

    const insId = app.inspector_id || app.inspectorId;
    if (!insId) continue;

    const appDate = app.preferred_date || app.preferredDate;
    const appTime = app.preferred_time || app.preferredTime;

    if (isSlotOverlapping(appDate, appTime, preferredDate, preferredTime)) {
      busyInspectorIds.add(String(insId));
    }
  }

  // 3. Filter candidates who are NOT busy
  const availableCandidates = activeInspectors.filter(ins => {
    return !busyInspectorIds.has(String(ins.id));
  });

  if (availableCandidates.length === 0) return null;

  // 4. Compute distance from each inspector base location to vendor location
  const candidatesWithDistance = availableCandidates.map(ins => {
    const baseLat = ins.baseLatitude ?? ins.base_latitude;
    const baseLng = ins.baseLongitude ?? ins.base_longitude;
    const distanceKm = calculateDistanceKm(baseLat, baseLng, vendorLatitude, vendorLongitude);
    return {
      inspector: ins,
      distanceKm: Math.round(distanceKm * 100) / 100
    };
  });

  // 5. Sort remaining candidates by distance ascending
  candidatesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  return candidatesWithDistance[0] || null;
}

module.exports = {
  calculateDistanceKm,
  isSlotOverlapping,
  findNearestAvailableInspector
};
