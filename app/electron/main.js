import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable hot reload for Electron main process in dev mode
if (isDev) {
    try {
        const electronReloader = await import('electron-reloader');
        electronReloader.default(module, {
            watchRenderer: false // Vite handles the renderer process
        });
    } catch (err) {
        console.log('Error loading electron-reloader:', err);
    }
}

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../electron/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        }
    });
    
    
    if(isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools(); // Open DevTools in dev mode
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    
    // Reload the window when the renderer process crashes in dev mode
    if (isDev) {
        mainWindow.webContents.on('crashed', () => {
            console.log('Renderer process crashed, reloading...');
            mainWindow.reload();
        });
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