import * as XLSX from "xlsx";
import * as path from "path";
import { config } from "./config.loader";

export interface ScadaVariable {
    name: string;
    description: string;
    driverType: "MTCP" | "ADS";
    subsystem: string;
    address?: number;
    bit?: number;
    indexGroup?: number;
    indexOffset?: number;
}

export class ExcelLoader {

    load(): ScadaVariable[] {
        const fileName = config.get("sim.excel.file");
        const sheetName = config.get("excel.sheet");
    
        if (!fileName) {
            throw new Error("Missing property: sim.excel.file");
        }
    
        if (!sheetName) {
            throw new Error("Missing property: excel.sheet");
        }
    
        const filePath = path.join(__dirname, "../../excel", fileName);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[sheetName];
    
        if (!sheet) {
            throw new Error(`Sheet '${sheetName}' not found in Excel file`);
        }
    
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
    
        const variables: ScadaVariable[] = [];
    
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;
    
            const name = row[0];
            const description = row[1];
            const driverFlag = row[33];
            const subsystem = row[38];
    
            if (!name || !description || !driverFlag || !subsystem) continue;
    
            const isModbus = driverFlag === "MTCP";
            const isAds = driverFlag === "POL" || driverFlag === "NOT";
    
            const variable: ScadaVariable = {
                name,
                description,
                driverType: isModbus ? "MTCP" : "ADS",
                subsystem
            };
    
            if (isModbus) {
                const addressColumnKey = `MODBUS_ADDRESS_${subsystem}`;
                const addressColumnStr = config.get(addressColumnKey);
    
                if (addressColumnStr) {
                    const addressColumn = Number(addressColumnStr);
    
                    if (!isNaN(addressColumn)) {
                        variable.address = Number(row[addressColumn]);
                        variable.bit = Number(row[addressColumn + 1]);
                    }
                }
            }
    
            if (isAds) {
                variable.indexGroup = Number(row[50]);
                variable.indexOffset = Number(row[51]);
            }
    
            variables.push(variable);
        }
    
        return variables;
    }
    
}

export const excelLoader = new ExcelLoader();
