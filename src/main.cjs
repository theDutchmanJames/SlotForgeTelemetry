const { app, BrowserWindow, Menu, session, net } = require('electron');
const path = require('node:path');
// Keep the existing workspace and appearance when upgrading the renamed app.
app.setPath('userData', path.join(app.getPath('appData'), 'SlotForge Calculator'));
app.setName('SlotForge Telemetry');
function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 980, minWidth: 760, minHeight: 620,
    title: 'SlotForge Telemetry', backgroundColor: '#171b21', icon: path.join(__dirname, process.platform === 'win32' ? '../assets/icon.ico' : '../assets/icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname,'preload.cjs') }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}
// A second process must not silently overwrite the first process's draft.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
app.on('second-instance', () => {
  const win=BrowserWindow.getAllWindows()[0];
  if(win){if(win.isMinimized())win.restore();win.show();win.focus();}
});
app.whenReady().then(() => {
  const paddock=require('./paddock-ipc.cjs').registerPaddock(app.getPath('userData'));
  require('./storage-ipc.cjs').registerStorage(app.getPath('userData'),{version:app.getVersion()});
  // "A new version is available": installed/portable apps ask GitHub by themselves; development copies only on "Check now".
  const updates=require('./update-ipc.cjs').registerUpdates(app.getPath('userData'),{current:app.getVersion(),homepage:require('../package.json').homepage,fetch:(url,init)=>net.fetch(url,init),automatic:app.isPackaged});
  app.on('before-quit',()=>{paddock.disconnect();updates.dispose();});
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{role:'appMenu'}] : []),
    { label: 'File', submenu: [{ role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] }
  ]));
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
