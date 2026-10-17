const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow() {
  // Sovereignty by design: any attempt to reach the network is cancelled at the shell level.
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*'] }, (_d, cb) => cb({ cancel: true }));
  const win = new BrowserWindow({
    width: 1920, height: 1080, backgroundColor: '#0D0D0D', show: false, autoHideMenuBar: true,
    title: 'منصة القيادة والمراقبة — آفاق تيتان',
    webPreferences: { contextIsolation: true, nodeIntegration: false, autoplayPolicy: 'no-user-gesture-required' },
  });
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type === 'keyDown' && i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.loadFile(path.join(__dirname, '..', 'out', 'index.html'));
  win.once('ready-to-show', () => {
    if (process.env.AFAQ_WINDOWED) win.maximize(); else win.setFullScreen(true);
    win.show();
  });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
