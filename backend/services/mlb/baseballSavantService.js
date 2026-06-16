const fs   = require("fs");
const path = require("path");

const OAA_FILE = path.join(__dirname, "../../data/oaa_2026.csv");

// 引用符を考慮したCSV行パーサー
// "last_name, first_name" のようにカンマを含むフィールドを正しく処理する
function parseCsvRow(line) {
  const fields = [];
  let current  = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

// 起動時に1回だけ読み込んでメモリに保持する（更新は再起動で反映）
let oaaCache = null;

const getOaaMap = () => {
  if (oaaCache) return oaaCache;

  try {
    const text    = fs.readFileSync(OAA_FILE, "utf-8");
    const lines   = text.replace(/^﻿/, "").trim().split("\n"); // BOM除去
    const headers = parseCsvRow(lines[0]);

    const playerIdIdx = headers.indexOf("player_id");
    const oaaIdx      = headers.indexOf("outs_above_average");

    if (playerIdIdx === -1 || oaaIdx === -1) {
      console.warn("[BaseballSavant] OAA CSV: required columns not found");
      oaaCache = {};
      return oaaCache;
    }

    const map = {};
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const fields = parseCsvRow(line);
      const id     = Number(fields[playerIdIdx]);
      const oaa    = parseFloat(fields[oaaIdx]);
      if (id && Number.isFinite(oaa)) {
        map[id] = oaa;
      }
    }

    console.log(`[BaseballSavant] OAA loaded: ${Object.keys(map).length} players`);
    oaaCache = map;
    return map;
  } catch (err) {
    console.warn(`[BaseballSavant] Failed to load OAA CSV: ${err.message}`);
    oaaCache = {};
    return {};
  }
};

module.exports = { getOaaMap };
