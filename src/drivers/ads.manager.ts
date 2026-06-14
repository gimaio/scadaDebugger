import { config } from "../core/config.loader";
import { AdsDriver } from "./ads.driver";

class AdsManager {
    private drivers: Record<string, AdsDriver> = {};

    constructor() {
        this.initializeDrivers();
    }

    private initializeDrivers() {
        const keys = config.getAllKeys();

        const subsystems = keys
            .filter((k: string) => {
                if (!k.startsWith("ADS_")) return false;
                if (k.includes("CYCLE_TIME_")) return false;

                const value = config.get(k);
                return value !== undefined && value.includes(":");
            })
            .map((k: string) => k.replace("ADS_", ""));

        console.log("[ADS] Subsystems trovati:", subsystems);

        for (const subsystem of subsystems) {
            const endpoint = config.get(`ADS_${subsystem}`);
            if (!endpoint) continue;

            const [amsNetId, portStr] = endpoint.split(":");
            const port = Number(portStr);

            if (!amsNetId || isNaN(port)) {
                console.log(`[ADS] Endpoint non valido per ${subsystem}:`, endpoint);
                continue;
            }

            this.drivers[subsystem] = new AdsDriver(amsNetId, port);
            console.log(`[ADS] Driver creato per ${subsystem} → ${amsNetId}:${port}`);
        }
    }

    getDriver(subsystem: string): AdsDriver | undefined {
        return this.drivers[subsystem];
    }
}

export const adsManager = new AdsManager();
