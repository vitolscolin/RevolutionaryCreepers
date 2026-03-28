import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../client/dist");

app.use(cors());
app.use(express.json());

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function calculateBaseRisk(inputs) {
  const baseScore =
    inputs.threatLevel * 0.32 +
    inputs.systemExposure * 0.28 +
    inputs.dataSensitivity * 0.24 +
    (100 - inputs.teamPreparedness) * 0.16;

  return clamp(baseScore, 0, 100);
}

function calculateAdjustedRisk(inputs) {
  const controlStrength = {
    Baseline: 6,
    Elevated: 14,
    Hardened: 24
  };

  const monitoringBonus = {
    Manual: 0,
    Assisted: 6,
    Automated: 12
  };

  const insuranceBonus = inputs.insuranceCoverage ? 5 : 0;
  const reduction =
    controlStrength[inputs.controlProfile] +
    monitoringBonus[inputs.monitoringMode] +
    insuranceBonus;

  return clamp(calculateBaseRisk(inputs) - reduction, 0, 100);
}

function categorize(score) {
  if (score < 35) return "Low";
  if (score < 65) return "Moderate";
  return "High";
}

app.post("/api/simulate-risk", (req, res) => {
  const inputs = req.body;

  const requiredFields = [
    "threatLevel",
    "systemExposure",
    "dataSensitivity",
    "teamPreparedness",
    "controlProfile",
    "monitoringMode",
    "insuranceCoverage"
  ];

  const missing = requiredFields.filter((field) => inputs[field] === undefined);
  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(", ")}`
    });
  }

  const beforeScore = Number(calculateBaseRisk(inputs).toFixed(1));
  const afterScore = Number(calculateAdjustedRisk(inputs).toFixed(1));
  const delta = Number((beforeScore - afterScore).toFixed(1));

  return res.json({
    beforeScore,
    afterScore,
    reduction: delta,
    beforeCategory: categorize(beforeScore),
    afterCategory: categorize(afterScore)
  });
});

app.use(express.static(clientDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  return res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Risk simulation server listening on http://localhost:${port}`);
});
