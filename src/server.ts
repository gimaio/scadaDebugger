import { app } from "./app";
import { pollingEngine } from "./engine/polling.engine";

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`SCADA Agent running on http://localhost:${PORT}`);
});

pollingEngine.start();
