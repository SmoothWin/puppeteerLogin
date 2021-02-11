console.log('main process working...');

const {app, BrowserWindow, ipcMain} = require('electron');
const connection = require('./puppeteer.js');

let win;

function createWindow(){
    win = new BrowserWindow({webPreferences:{nodeIntegration:true,contextIsolation:false}});
    // win.loadURL(url.format({ //deprecated
    //     pathname:path.join(__dirname,'index.html'),
    //     protocol: 'file',
    //     slashes: true
    // })); 
    win.loadURL(`file://${__dirname}/index.html`);
    // win.webContents.openDevTools(); //toggles dev tools
    win.on('closed',()=>{
        win = null;
    });
}
app.on('ready', createWindow);

app.on('window-all-closed',()=>{
    if (process.platform !== 'darwin'){
        app.quit()
    }
});

app.on('activate',()=>{
    if (win ===null){
        createWindow();
    }
});
ipcMain.on('form-submission', function (event, studentID, studentPass){
    connection(studentID, studentPass);

});


