import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config = { MAQUINA_ID: 1 }; // default config

if (fs.existsSync(configPath)) {
    const rawData = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(rawData);
}

// IPC Handlers
ipcMain.handle('get-maquina-id', () => {
    return config.MAQUINA_ID;
});

ipcMain.handle('launch-game', async (event, gamePath: string) => {
    const { exec } = await import('child_process');
    return new Promise((resolve, reject) => {
        exec(gamePath, (error) => {
            if (error) {
                console.error('Erro ao iniciar o jogo:', error);
                reject(error);
            } else {
                resolve(true);
            }
        });
    });
});

let mainWindow: BrowserWindow | null;

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        fullscreen: true,
        title: "Arena Gamer"
    });
    
    
    if(isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    //additional logic here
}).then(createWindow)

app.on('window-all-closed', () => {
    // eslint-disable-next-line no-undef
    if (process.platform !== 'darwin') {
        app.quit()
    }
})