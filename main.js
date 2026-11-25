const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const core = require('./core');

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1120, height: 700, minWidth: 940, minHeight: 620,
    backgroundColor: '#0a120c', title: 'Forest Launcher', icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'index.html'));
}
const send = (ch, d) => { if (win && !win.isDestroyed()) win.webContents.send(ch, d); if (ch === 'state') { gameRunning = !!(d && d.running); syncOverlay(); } };

/* ---------- панель поверх игры ---------- */
let ov = null, ovOpen = false, gameRunning = false;
const KEYS = { 'alt+x': ['Alt+X', 'Alt+X'], x: ['X', 'X'], f8: ['F8', 'F8'] };
const ovCfg = () => { try { return core.api.getState().cfg; } catch { return {}; } };
function ovBounds() {
  const b = screen.getPrimaryDisplay().bounds, w = ovOpen ? 360 : 230, h = ovOpen ? Math.min(b.height - 24, 700) : 44;
  return { x: b.x + b.width - w - 12, y: b.y + 12, width: w, height: h };
}
function ovPush() { if (ov && !ov.isDestroyed()) ov.webContents.send('ovstate', { open: ovOpen, key: (KEYS[ovCfg().visKey] || KEYS['alt+x'])[1] }); }
function ovSetOpen(o) {
  if (!ov || ov.isDestroyed()) return; ovOpen = !!o;
  ov.setBounds(ovBounds()); ov.setFocusable(ovOpen);
  if (ovOpen) ov.focus();
  ovPush();
}
function syncOverlay() {
  const c = ovCfg(), want = gameRunning && c.visuals !== false && c.overlay !== false;
  globalShortcut.unregisterAll();
  if (!want) { if (ov && !ov.isDestroyed()) ov.destroy(); ov = null; ovOpen = false; return; }
  if (!ov || ov.isDestroyed()) {
    ov = new BrowserWindow({
      ...ovBounds(), transparent: true, frame: false, resizable: false, movable: false, skipTaskbar: true, hasShadow: false, show: false, focusable: false, alwaysOnTop: true,
      webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
    });
    ov.setAlwaysOnTop(true, 'screen-saver'); ov.setVisibleOnAllWorkspaces(true);
    ov.loadFile(path.join(__dirname, 'overlay.html'));
    ov.webContents.once('did-finish-load', () => { ovPush(); if (ov && !ov.isDestroyed()) ov.showInactive(); });
    ov.on('closed', () => { ov = null; ovOpen = false; });
  } else ovPush();
  try { globalShortcut.register((KEYS[c.visKey] || KEYS['alt+x'])[0], () => ovSetOpen(!ovOpen)); } catch {}
}
ipcMain.handle('overlay', (_e, cmd) => {
  if (cmd === 'toggle') ovSetOpen(!ovOpen); else if (cmd === 'close') ovSetOpen(false); else if (cmd === 'refresh') syncOverlay();
  return true;
});
app.on('will-quit', () => globalShortcut.unregisterAll());

app.whenReady().then(() => { core.init(app.getPath('appData'), send); createWindow(); });
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (ov && !ov.isDestroyed()) ov.destroy(); });

ipcMain.handle('api', async (_e, name, ...args) => {
  try {
    if (!core.api[name]) throw new Error('Unknown api: ' + name);
    return { ok: true, data: await core.api[name](...args) };
  } catch (e) { return { ok: false, error: String(e.message || e) }; }
});
