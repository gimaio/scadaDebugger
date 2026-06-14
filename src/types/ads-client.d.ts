declare module "ads-client" {
    export default class AdsClient {
        constructor(options: any);
        connect(): Promise<void>;
        disconnect(): Promise<void>;

        readRaw(options: {
            indexGroup: number;
            indexOffset: number;
            size: number;
        }): Promise<{ value: Buffer }>;

        writeRaw(options: {
            indexGroup: number;
            indexOffset: number;
            value: Buffer;
        }): Promise<void>;

        subscribeRaw(
            options: {
                indexGroup: number;
                indexOffset: number;
                size: number;
            },
            callback: (res: { value: Buffer }) => void
        ): Promise<void>;
    }
}
