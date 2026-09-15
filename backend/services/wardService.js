const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");

const WARD_MASTER_PATH = path.join(
  __dirname,
  "..",
  "data",
  "SIH_WARD_MASTER_FINAL.csv",
);

let wardsCache = null;

function loadWardMaster() {
  if (wardsCache) {
    return wardsCache;
  }

  if (!fs.existsSync(WARD_MASTER_PATH)) {
    throw new Error(`Ward master CSV not found: ${WARD_MASTER_PATH}`);
  }

  const file = fs.readFileSync(WARD_MASTER_PATH, "utf8");

  const records = csv.parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  wardsCache = records.map((ward) => ({
    ward_id: String(ward.ward_id),
    ward_name: ward.ward_name,
    circle: ward.circle,
    zone: ward.zone,

    area_sq_m: Number(ward.area_sq_m),
    latitude: Number(ward.latitude),
    longitude: Number(ward.longitude),

    population: Number(ward.population),
    population_density: Number(ward.population_density),
    elderly_percentage: Number(ward.elderly_percentage),
    outdoor_worker_density: Number(ward.outdoor_worker_density),
    healthcare_access: Number(ward.healthcare_access),
    informal_settlement_percentage: Number(ward.informal_settlement_percentage),

    vulnerability_score: Number(ward.vulnerability_score),
    vulnerability_level: ward.vulnerability_level,
  }));

  return wardsCache;
}

function getAllWards() {
  return loadWardMaster();
}

function getWardById(wardId) {
  const wards = loadWardMaster();

  return wards.find((ward) => ward.ward_id === String(wardId));
}

module.exports = {
  getAllWards,
  getWardById,
};
