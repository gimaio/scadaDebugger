const { Client } = require("ads-client");

export class AdsDriver {
    private client: any;
    private connected = false;

    constructor(amsNetId: string, port: number) {
        const ip = amsNetId.split(".").slice(0, 4).join(".");

        this.client = new Client({
            targetAmsNetId: amsNetId,
            targetAdsPort: port,
            targetIp: ip
        });
    }

    async connect() {
        try {
            await this.client.connect();
            this.connected = true;
            console.log("[ADS] Connected");
        } catch (err) {
            console.error("[ADS] Connection error:", err);
        }
    }

    async read(indexGroup: number, indexOffset: number, length: number): Promise<Buffer | null> {
        if (!this.connected) return null;

        try {
            const res = await this.client.readRaw({
                indexGroup,
                indexOffset,
                size: length
            });

            return res.value;
        } catch (err) {
            console.error("[ADS] Read error:", err);
            return null;
        }
    }

    async write(indexGroup: number, indexOffset: number, value: number) {
        if (!this.connected) return;

        try {
            const buf = Buffer.alloc(4);
            buf.writeInt32LE(value);

            await this.client.writeRaw({
                indexGroup,
                indexOffset,
                value: buf
            });
        } catch (err) {
            console.error("[ADS] Write error:", err);
        }
    }

    async subscribeNotification(
        indexGroup: number,
        indexOffset: number,
        length: number,
        callback: (buf: Buffer) => void
    ) {
        if (!this.connected) return;

        try {
            await this.client.subscribeRaw(
                {
                    indexGroup,
                    indexOffset,
                    size: length
                },
                (res: any) => callback(res.value)
            );
        } catch (err) {
            console.error("[ADS] Subscribe error:", err);
        }
    }
}
