import { config } from "../core/config.loader";
import { ModbusDriver } from "./modbus.driver";

export class ModbusManager {
    private drivers: Record<string, ModbusDriver> = {};

    constructor() {
        this.loadDrivers();
    }

    private loadDrivers() {
        const subsystems = ["SHM", "GE", "LGRNG", "PANDORA"];

        subsystems.forEach(sub => {
            const key = `MODBUS_${sub}`;
            const value = config.get(key);

            if (!value) return;

            const [host, portStr] = value.split(":");
            const port = Number(portStr);

            this.drivers[sub] = new ModbusDriver(host, port);
        });
    }

    getDriver(subsystem: string): ModbusDriver | null {
        return this.drivers[subsystem] || null;
    }
}

export const modbusManager = new ModbusManager();
