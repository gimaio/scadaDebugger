import { app } from "./app";

import { pollingEngine } from "./engine/polling.engine";               // Modbus
import { adsPollingEngine } from "./engine/ads.polling.engine";       // ADS POL
import { adsNotificationEngine } from "./engine/ads.notification.engine"; // ADS NOT

import { excelService } from "./core/excel.service";
import { getMeasureStats, logMeasureStats } from "./utils/measure.counter";

const PORT = 3000;

// -----------------------------------------------------
// 1️⃣ CARICAMENTO EXCEL UNA SOLA VOLTA
// -----------------------------------------------------
const vars = excelService.load();   // <-- loader eseguito solo qui
console.log(`[INIT] Excel loader ha caricato ${vars.length} variabili totali`);

// -----------------------------------------------------
// 2️⃣ LOG DEL CONTEGGIO MISURE (usa la cache)
// -----------------------------------------------------
logMeasureStats();

// -----------------------------------------------------
// 3️⃣ ENDPOINTS (usano la cache)
// -----------------------------------------------------
app.get("/api/stats", (req, res) => {
    res.json(getMeasureStats());
});

app.get("/api/excel", (req, res) => {
    res.json(excelService.load());
});

// -----------------------------------------------------
// 4️⃣ AVVIO MOTORI (usano la cache)
// -----------------------------------------------------
pollingEngine.start();          // Modbus
adsPollingEngine.start();       // ADS POL
adsNotificationEngine.start();  // ADS NOT

// -----------------------------------------------------
// 5️⃣ AVVIO SERVER
// -----------------------------------------------------
app.listen(PORT, () => {
    console.log(`SCADA Agent running on http://localhost:${PORT}`);
});
