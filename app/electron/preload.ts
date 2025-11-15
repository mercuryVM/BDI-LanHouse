import { contextBridge, ipcRenderer } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config = { MAQUINA_ID: 1 }; // default config

if (fs.existsSync(configPath)) {
    const rawData = fs.readFileSync(configPath);
    config = JSON.parse(rawData.toString());
}

contextBridge.exposeInMainWorld('api', {
  getMaquinaId: () => config.MAQUINA_ID,
});