const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getMaquinaId: () => ipcRenderer.invoke('get-maquina-id'),
  launchGame: (gamePath) => ipcRenderer.invoke('launch-game', gamePath),
});