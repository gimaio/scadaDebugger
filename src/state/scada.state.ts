export interface ScadaValue {
    name: string;
    value: number | null;
    timestamp: number;
}

export class ScadaState {
    private values: Record<string, ScadaValue> = {};

    set(name: string, value: number | null) {
        this.values[name] = {
            name,
            value,
            timestamp: Date.now()
        };
    }

    get(name: string) {
        return this.values[name] || null;
    }

    getAll() {
        return this.values;
    }
}

export const scadaState = new ScadaState();
