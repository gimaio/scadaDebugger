import * as fs from "fs";
import * as path from "path";

export class ConfigLoader {
    private config: Record<string, string> = {};

    constructor() {
        const fs = require("fs");
        const path = require("path");

        const filePath = path.join(__dirname, "../../config/agent.properties");
        const lines = fs.readFileSync(filePath, "utf-8").split("\n");

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;

            const [key, ...rest] = trimmed.split("=");
            if (!key) continue;

            this.config[key] = rest.join("=").trim();
        }
    }

    get(key: string): string | undefined {
        return this.config[key];
    }

    getAllKeys(): string[] {
        return Object.keys(this.config);
    }
}

export const config = new ConfigLoader();
