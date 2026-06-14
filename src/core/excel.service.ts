import { excelLoader } from "./excel.loader";
import { ScadaVariable } from "./excel.loader";

class ExcelService {
    private cache: ScadaVariable[] | null = null;

    load(): ScadaVariable[] {
        if (!this.cache) {
            console.log("[EXCEL] Caricamento iniziale...");
            this.cache = excelLoader.load();
            console.log("[EXCEL] Caricate", this.cache.length, "variabili");
        }
        return this.cache;
    }
}

export const excelService = new ExcelService();
