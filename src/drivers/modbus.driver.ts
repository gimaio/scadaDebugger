import ModbusRTU from "modbus-serial";

export class ModbusDriver {
    private client: ModbusRTU;
    private host: string;
    private port: number;
    private connected = false;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
        this.client = new ModbusRTU();

        this.connect();
    }
    async readRegisters(start: number, length: number): Promise<number[] | null> {
        if (!this.connected) return null;
    
        try {
            const res = await this.client.readHoldingRegisters(start, length);
            return res.data; // array di numeri
        } catch (err) {
            console.log("[MODBUS] Batch read error:", err);
            return null;
        }
    }
    

    private async connect() {
        try {
            await this.client.connectTCP(this.host, { port: this.port });
            this.client.setID(1);
            this.connected = true;
            console.log(`[MODBUS] Connected to ${this.host}:${this.port}`);
        } catch (err) {
            console.log("[MODBUS] Connection failed, retrying...");
            setTimeout(() => this.connect(), 2000);
        }
    }

    async readRegister(address: number): Promise<number | null> {
        if (!this.connected) return null;

        try {
            const res = await this.client.readHoldingRegisters(address, 1);
            return res.data[0];
        } catch (err) {
            console.log("[MODBUS] Read error:", err);
            return null;
        }
    }

    async readBit(address: number, bit: number): Promise<number | null> {
        const value = await this.readRegister(address);
        if (value === null) return null;
        return (value >> bit) & 1;
    }

    async writeRegister(address: number, value: number): Promise<boolean> {
        if (!this.connected) return false;

        try {
            await this.client.writeRegister(address, value);
            return true;
        } catch (err) {
            console.log("[MODBUS] Write error:", err);
            return false;
        }
    }

    async writeBit(address: number, bit: number, state: boolean): Promise<boolean> {
        const current = await this.readRegister(address);
        if (current === null) return false;

        const newValue = state
            ? current | (1 << bit)
            : current & ~(1 << bit);

        return this.writeRegister(address, newValue);
    }
}
