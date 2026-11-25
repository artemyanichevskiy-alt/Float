const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('L', {
  call: (name, ...args) => ipcRenderer.invoke('api', name, ...args),
  overlay: (cmd) => ipcRenderer.invoke('overlay', cmd),
  on: (ch, cb) => ipcRenderer.on(ch, (_e, d) => cb(d))
});
