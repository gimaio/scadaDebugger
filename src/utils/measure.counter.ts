import { excelService } from "../core/excel.service";

export interface MeasureStats {
    MTCP: Record<string, number>;
    ADS_POL: Record<string, number>;
    ADS_NOT: Record<string, number>;
}

export function getMeasureStats(): MeasureStats {
    const vars = excelService.load();   // <-- usa la cache, NON rilegge Excel

    const stats: MeasureStats = {
        MTCP: {},
        ADS_POL: {},
        ADS_NOT: {}
    };

    for (const v of vars) {
        if (v.driverType === "MTCP") {
            stats.MTCP[v.subsystem] = (stats.MTCP[v.subsystem] || 0) + 1;
        }

        if (v.driverType === "ADS" && v.driverFlag === "POL") {
            stats.ADS_POL[v.subsystem] = (stats.ADS_POL[v.subsystem] || 0) + 1;
        }

        if (v.driverType === "ADS" && v.driverFlag === "NOT") {
            stats.ADS_NOT[v.subsystem] = (stats.ADS_NOT[v.subsystem] || 0) + 1;
        }
    }

    return stats;
}

export function logMeasureStats() {
    const stats = getMeasureStats();

    for (const [sub, count] of Object.entries(stats.MTCP)) {
        console.log(`[COUNT] MTCP ${sub} → ${count} misure`);
    }

    for (const [sub, count] of Object.entries(stats.ADS_POL)) {
        console.log(`[COUNT] ADS POL ${sub} → ${count} misure`);
    }

    for (const [sub, count] of Object.entries(stats.ADS_NOT)) {
        console.log(`[COUNT] ADS NOT ${sub} → ${count} misure`);
    }
}
