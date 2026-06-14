import express from "express";
import cors from "cors";
import * as XLSX from "xlsx";
import * as path from "path";

import { excelService } from "./core/excel.service";   // <-- CACHE
import { config } from "./core/config.loader";         // <-- FIX CONFIG
import { modbusManager } from "./drivers/modbus.manager";
import { scadaState } from "./state/scada.state";

export const app = express();
app.use(cors());
app.use(express.json());

// Carica Excel UNA SOLA VOLTA
const vars = excelService.load();

app.get("/api/state", (req, res) => {
    res.json(scadaState.getAll());
});

app.get("/api/ping", (req, res) => {
    res.json({ status: "ok", message: "SCADA Agent Online" });
});

// ❌ RIMOSSO excelLoader
// import { excelLoader } from "./core/excel.loader";

// Usa la CACHE
app.get("/api/excel", (req, res) => {
    res.json(excelService.load());
});

app.get("/api/excel/preview", (req, res) => {
    try {
        const fileName = config.get("sim.excel.file");
        const sheetName = config.get("excel.sheet");

        if (!fileName) throw new Error("Missing property: sim.excel.file");
        if (!sheetName) throw new Error("Missing property: excel.sheet");

        const filePath = path.join(__dirname, "../excel", fileName);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) throw new Error(`Sheet '${sheetName}' not found in Excel file`);

        const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

        res.json({
            sheetName,
            totalRows: rows.length,
            preview: rows.slice(0, 5)
        });

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/modbus/read", async (req, res) => {
    const subsystem = String(req.query.subsystem);
    const address = Number(req.query.address);
    const bit = req.query.bit ? Number(req.query.bit) : null;

    const driver = modbusManager.getDriver(subsystem);
    if (!driver) return res.status(404).json({ error: "Subsystem not found" });

    const value = bit === null
        ? await driver.readRegister(address)
        : await driver.readBit(address, bit);

    res.json({ subsystem, address, bit, value });
});
