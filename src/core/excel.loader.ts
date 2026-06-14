import * as XLSX from "xlsx";
import * as path from "path";
import { config } from "./config.loader";

export interface ScadaVariable {
    name: string;
    description: string;

    driverType: "MTCP" | "ADS";
    driverFlag?: "POL" | "NOT";

    subsystem: string;

    // Modbus
    address?: number;
    bit?: number | null;

    // ADS
    indexGroup?: number;
    indexOffset?: number;
}

export class ExcelLoader {

    load(): ScadaVariable[] {
        const fileNamesRaw = config.get("sim.excel.file");
        const sheetNamesRaw = config.get("excel.sheet");

        if (!fileNamesRaw) throw new Error("Missing property: sim.excel.file");
        if (!sheetNamesRaw) throw new Error("Missing property: excel.sheet");

        const fileNames = fileNamesRaw.split(",").map(f => f.trim());
        const sheetGroups = sheetNamesRaw
            .split(",")
            .map(group => group.split(";").map(s => s.trim()));

        if (fileNames.length !== sheetGroups.length) {
            throw new Error(
                `Excel config mismatch: files=${fileNames.length}, sheet groups=${sheetGroups.length}`
            );
        }

        const variables: ScadaVariable[] = [];

        for (let i = 0; i < fileNames.length; i++) {
            const fileName = fileNames[i];
            const sheets = sheetGroups[i];

            const filePath = path.join(__dirname, "../../excel", fileName);
            const workbook = XLSX.readFile(filePath);

            for (const sheetName of sheets) {
                const sheet = workbook.Sheets[sheetName];

                if (!sheet) {
                    console.warn(`[EXCEL] Sheet '${sheetName}' not found in file '${fileName}'`);
                    continue;
                }

                const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

                for (let r = 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row) continue;

                    const name = row[0];
                    const description = row[1];
                    const driverFlag = String(row[33] || "").toUpperCase().trim(); // AH
                    const subsystem = String(row[38] || "").trim();                // AM

                    if (!name || !description || !driverFlag || !subsystem) continue;

                    // DRIVER DETECTION ROBUSTO
                    const isModbus =
                        driverFlag.includes("MTCP") ||
                        driverFlag.includes("MODBUS") ||
                        driverFlag === "M" ||
                        driverFlag === "TCP";

                    const isAds = driverFlag === "POL" || driverFlag === "NOT";

                    if (!isModbus && !isAds) continue;

                    // VALIDAZIONE UNIVERSALE DRIVER + SUBSYSTEM
                    if (isModbus) {
                        const key = `MODBUS_ADDRESS_${subsystem}`;
                        const col = config.get(key);

                        if (!col) {
                            console.warn(`[EXCEL] Missing ${key} in properties → skipping ${name}`);
                            continue;
                        }
                    }

                    if (isAds) {
                        const key = `ADS_ADDRESS_${subsystem}`;
                        const col = config.get(key);

                        if (!col) {
                            console.warn(`[EXCEL] Missing ${key} in properties → skipping ${name}`);
                            continue;
                        }
                    }

                    const variable: ScadaVariable = {
                        name,
                        description,
                        driverType: isModbus ? "MTCP" : "ADS",
                        subsystem,
                        driverFlag: isAds ? (driverFlag as "POL" | "NOT") : undefined
                    };

                    // -------------------------
                    // MODBUS
                    // -------------------------
                    if (isModbus) {
                        const base = Number(config.get(`MODBUS_ADDRESS_${subsystem}`));

                        if (!isNaN(base)) {
                            variable.address = Number(row[base]);
                            variable.bit = Number(row[base + 1]);
                        }
                    }

                    // -------------------------
                    // ADS
                    // -------------------------
                    if (isAds) {
                        const base = Number(config.get(`ADS_ADDRESS_${subsystem}`));

                        const ig = row[base];
                        const io = row[base + 1];

                        if (typeof ig !== "number" || typeof io !== "number") {
                            console.warn(
                                `[EXCEL] Missing ADS indexGroup/indexOffset for ${name} at columns ${base}, ${base + 1}`
                            );
                            continue;
                        }

                        variable.indexGroup = ig;
                        variable.indexOffset = io;

                        const bit = row[base + 2];
                        if (typeof bit === "number") variable.bit = bit;
                    }

                    variables.push(variable);
                }
            }
        }

        return variables;
    }
}

export const excelLoader = new ExcelLoader();
