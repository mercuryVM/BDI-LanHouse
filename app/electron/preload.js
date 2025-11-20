const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getMaquinaId: () => ipcRenderer.invoke('get-maquina-id'),
  launchGame: (gamePath) => ipcRenderer.invoke('launch-game', gamePath),
});

webFrame.setZoomFactor(1);
webFrame.setVisualZoomLevelLimits(1, 1);
webFrame.setLayoutZoomLevelLimits(0, 0);