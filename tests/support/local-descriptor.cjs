// Publishes a stand-in Paddock's descriptor the way Paddock does: in a folder private to this user, with the file
// owned by and readable only by the user. An elevated process (such as a CI runner) otherwise creates files owned
// by the Administrators group, which discovery rightly refuses.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
function publishDescriptor(folder,descriptor){
 fs.mkdirSync(folder,{recursive:true,mode:0o700});
 fs.writeFileSync(path.join(folder,'d'.repeat(64)+'.json'),JSON.stringify(descriptor),{mode:0o600});
 if(process.platform!=='win32'){fs.chmodSync(folder,0o700);return;}
 const script=`$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue';$d=$env:TEST_DIR;$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
$acl=New-Object Security.AccessControl.DirectorySecurity;$acl.SetOwner($sid);$acl.SetAccessRuleProtection($true,$false);$acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')));[IO.Directory]::SetAccessControl($d,$acl)
foreach($f in [IO.Directory]::GetFiles($d)){$fa=New-Object Security.AccessControl.FileSecurity;$fa.SetOwner($sid);$fa.SetAccessRuleProtection($true,$false);$fa.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','Allow')));[IO.File]::SetAccessControl($f,$fa)}`;
 execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{env:{...process.env,TEST_DIR:folder},windowsHide:true,stdio:'ignore'});
}
module.exports={publishDescriptor};
