import { excelLoader } from "../core/excel.loader";
import { adsManager } from "../drivers/ads.manager";
import { scadaState } from "../state/scada.state";
import { config } from "../core/config.loader";
import { excelService } from "../core/excel.service";

// TYPE GUARD — fondamentale
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

export class AdsPollingEngine {
    private running = false;

    start() {
        if (this.running) return;
        this.running = true;
    
        this.initializeState();   // <── QUI
    
        console.log("[ADS-POLLING] Starting engine...");
    
        const subsystems = this.getAdsSubsystems();
        console.log("[ADS-POLLING] Subsystems trovati:", subsystems);
    
        for (const subsystem of subsystems) {
            this.startSubsystemPolling(subsystem);
        }
    }
    

    private initializeState() {
        
        const vars = excelService.load().filter(v => v.driverType === "ADS");
    
        for (const v of vars) {
            scadaState.set(v.name, null);
        }
    
        console.log(`[ADS-POLLING] Stato inizializzato con ${vars.length} variabili ADS`);
    }
    
    private getAdsSubsystems(): string[] {
        const keys = config.getAllKeys();
    
        return keys
            .filter(k => k.startsWith("ADS_"))
            .filter(k => !k.startsWith("ADS_ADDRESS_"))
            .filter(k => !k.startsWith("ADS_CYCLE_TIME_"))
            .filter(k => {
                const value = config.get(k);
                return typeof value === "string" && value.includes(":"); // deve essere IP:PORT
            })
            .map(k => k.replace("ADS_", ""));
    }

    private startSubsystemPolling(subsystem: string) {
        const cycleTime = Number(config.get(`ADS_CYCLE_TIME_${subsystem}`)) || 200;

        console.log(`[ADS-POLLING] ${subsystem} cycle time = ${cycleTime} ms`);

        const loop = async () => {
            while (this.running) {
                await this.pollSubsystem(subsystem);
                await new Promise(res => setTimeout(res, cycleTime));
            }
        };

        loop();
    }

    private async pollSubsystem(subsystem: string) {
        // TYPE GUARD DEVE ESSERE IL PRIMO FILTRO
        const vars = excelService.load()
            .filter(isAdsPolVariable)
            .filter(v => v.subsystem === subsystem);

        if (vars.length === 0) return;

        const driver = adsManager.getDriver(subsystem);
        if (!driver) return;

        for (const v of vars) {
            
            if (v.indexGroup !== undefined && v.indexOffset !== undefined) {
                const buf = await driver.read(v.indexGroup, v.indexOffset, 4);
                if (!buf) continue;

                const value = buf.readInt32LE(0);
                scadaState.set(v.name, value);
            }
        }
    }
}

export const adsPollingEngine = new AdsPollingEngine();
