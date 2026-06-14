import { excelLoader } from "../core/excel.loader";
import { excelService } from "../core/excel.service";
import { adsManager } from "../drivers/ads.manager";
import { scadaState } from "../state/scada.state";

// TYPE GUARD — dice a TS che indexGroup/indexOffset sono number
function isAdsNotVariable(v: any): v is { indexGroup: number; indexOffset: number; name: string; subsystem: string } {
    return (
        v.driverType === "ADS" &&
        v.driverFlag === "NOT" &&
        typeof v.indexGroup === "number" &&
        v.indexGroup !== undefined &&
        typeof v.indexOffset === "number" &&
        v.indexOffset !== undefined
    );
}

function isAdsPolVariable(
    v: any
): v is { indexGroup: number; indexOffset: number; name: string; subsystem: string } {
    return (
        v.driverType === "ADS" &&
        v.driverFlag === "POL" &&
        typeof v.indexGroup === "number" &&
        typeof v.indexOffset === "number"
    );
}


export class AdsNotificationEngine {
    start() {
        console.log("[ADS-NOTIFY] Starting ADS notification engine...");
    
        this.initializeState();   // <── QUI
    
        const vars = excelService.load().filter(v =>
            v.driverType === "ADS" &&
            v.driverFlag === "NOT"
        );
    
        for (const v of vars) {
            const driver = adsManager.getDriver(v.subsystem);
            if (!driver) continue;
    
            driver.subscribeNotification(
                v.indexGroup!,
                v.indexOffset!,
                4,
                (buf) => {
                    const value = buf.readInt32LE(0);
                    scadaState.set(v.name, value);
                }
            );
    
            console.log(`[ADS-NOTIFY] Subscribed ${v.name}`);
        }
    }
    

    private initializeState() {
        const vars = excelService.load()
            .filter(v => v.driverType === "ADS")
            .filter(v => v.driverFlag === "NOT");
    
        for (const v of vars) {
            scadaState.set(v.name, null);
        }
    
        console.log(`[ADS-NOTIFY] Stato inizializzato con ${vars.length} variabili ADS NOT`);
    }
    
}

export const adsNotificationEngine = new AdsNotificationEngine();
