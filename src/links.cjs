'use strict';
// Links that open a new window (the sources under Driver Feedback advice) go to the default browser; the app itself
// never opens another window and never leaves its own page. Only https links: no files, no other schemes.
const {shell}=require('electron');
function guardLinks(webContents){
 webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\/[^\s]+$/i.test(url))shell.openExternal(url).catch(()=>{});return {action:'deny'};});
 webContents.on('will-navigate',event=>event.preventDefault());
}
module.exports={guardLinks};
