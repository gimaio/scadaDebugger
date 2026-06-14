import { excelLoader } from "../core/excel.loader";
import { modbusManager } from "../drivers/modbus.manager";
import { scadaState } from "../state/scada.state";
import { config } from "../core/config.loader";
import { excelService } from "../core/excel.service";

export class PollingEngine {
    private running = false;

    start() {
        if (this.running) return;
        this.running = true;

        console.log("[POLLING] Starting engine...");

        // Inizializza lo stato con tutte le variabili MTCP
        this.initializeState();

        // Avvia un loop indipendente per ogni subsystem Modbus
        const subsystems = this.getModbusSubsystems();

        console.log("[POLLING] Subsystems trovati:", subsystems);
        
        for (const subsystem of subsystems) {
            this.startSubsystemPolling(subsystem);
        }
        
    }

    private getModbusSubsystems(): string[] {
        const keys = config.getAllKeys();

        return keys
            .filter((k: string) => {
                if (!k.startsWith("MODBUS_")) return false;
                if (k.includes("ADDRESS_")) return false;
                if (k.includes("CYCLE_TIME_")) return false;

                const value = config.get(k);
                if (!value) return false;

                // accetta solo valori tipo "192.168.1.10:502"
                return value.includes(":");
            })
            .map((k: string) => k.replace("MODBUS_", ""));
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
    
    
    private initializeState() {
        const vars = excelService.load().filter(v =>
            v.driverType === "MTCP" &&
            typeof v.address === "number" &&
            !isNaN(v.address)
        );

        console.log(`[INIT] Inizializzo stato con ${vars.length} variabili MTCP`);

        for (const v of vars) {
            scadaState.set(v.name, null);
        }
    }

    private startSubsystemPolling(subsystem: string) {
        const cycleTime = Number(config.get(`MODBUS_CYCLE_TIME_${subsystem}`)) || 1000;

        console.log(`[POLLING] ${subsystem} cycle time = ${cycleTime} ms`);

        const loop = async () => {
            while (this.running) {
                await this.pollSubsystem(subsystem);
                await new Promise(res => setTimeout(res, cycleTime));
            }
        };

        loop();
    }

    private async pollSubsystem(subsystem: string) {
        // 1. Filtra SOLO variabili MTCP con address valido
        const vars = excelService.load().filter(v =>
            v.driverType === "MTCP" &&
            v.subsystem === subsystem &&
            typeof v.address === "number" &&
            !isNaN(v.address)
        );

        if (vars.length === 0) return;

        const driver = modbusManager.getDriver(subsystem);
        if (!driver) return;

        // 2. Ordina per address
        vars.sort((a, b) => (a.address as number) - (b.address as number));

        // 3. Crea blocchi consecutivi
        const blocks: { start: number; end: number; vars: any[] }[] = [];

        let currentStart = vars[0].address as number;
        let currentEnd = vars[0].address as number;
        let currentVars = [vars[0]];

        for (let i = 1; i < vars.length; i++) {
            const addr = vars[i].address as number;

            if (addr - currentEnd <= 10) {
                currentEnd = addr;
                currentVars.push(vars[i]);
            } else {
                blocks.push({ start: currentStart, end: currentEnd, vars: currentVars });
                currentStart = addr;
                currentEnd = addr;
                currentVars = [vars[i]];
            }
        }

        blocks.push({ start: currentStart, end: currentEnd, vars: currentVars });

        // 4. Leggi ogni blocco
        for (const block of blocks) {
            const length = block.end - block.start + 1;

            const res = await driver.readRegisters(block.start, length);
            if (!res) continue;

            // 5. Distribuisci i valori
            for (const v of block.vars) {
                const offset = (v.address as number) - block.start;
                const raw = res[offset];

                const bit = typeof v.bit === "number" ? v.bit : null;

                const value = bit === null ? raw : ((raw >> bit) & 1);

                scadaState.set(v.name, value);
            }
        }
    }
}

export const pollingEngine = new PollingEngine();
