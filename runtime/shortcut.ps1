param([ValidateSet('Install','Inspect','Remove')][string]$Action='Inspect',[Parameter(Mandatory=$true)][string]$Root,[Parameter(Mandatory=$true)][string]$Executable,[Parameter(Mandatory=$true)][string]$LauncherShell,[string]$Directory='',[string]$PreviousRoot='')
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
$taskRoot=(Resolve-Path -LiteralPath $Root).Path
$taskCmd=Join-Path $taskRoot 'Start-Codex.cmd'
if(-not(Test-Path -LiteralPath $taskCmd -PathType Leaf)){throw 'Launcher missing'}
if(-not [IO.Path]::IsPathRooted($Executable)){throw 'Absolute official executable path required'}
if(-not $Directory){$Directory=[Environment]::GetFolderPath('DesktopDirectory')}
$taskDirectory=(Resolve-Path -LiteralPath $Directory).Path
$taskPath=Join-Path $taskDirectory 'Codex · 司天阁.lnk'
$taskTarget=(Resolve-Path -LiteralPath $LauncherShell).Path
$taskArguments='-NoProfile -NonInteractive -WindowStyle Hidden -File "'+(Join-Path $taskRoot 'Desktop-Launch.ps1')+'"'
$taskShell=New-Object -ComObject WScript.Shell
$taskExists=Test-Path -LiteralPath $taskPath -PathType Leaf
$taskOwned=$false
$taskUpgrade=$false
if($taskExists){
    $taskExisting=$taskShell.CreateShortcut($taskPath)
    $taskOwned=[string]::Equals($taskExisting.TargetPath,$taskTarget,[StringComparison]::OrdinalIgnoreCase) -and [string]::Equals($taskExisting.Arguments,$taskArguments,[StringComparison]::OrdinalIgnoreCase)
    if($PreviousRoot){
        $taskPrevious=(Resolve-Path -LiteralPath $PreviousRoot).Path
        $taskOldArgs='/d /c ""'+(Join-Path $taskPrevious 'Start-Codex.cmd')+'""'
        $taskPreviousPS='-NoProfile -NonInteractive -WindowStyle Hidden -File "'+(Join-Path $taskPrevious 'Desktop-Launch.ps1')+'"'
        $taskLegacy=[string]::Equals($taskExisting.TargetPath,$env:ComSpec,[StringComparison]::OrdinalIgnoreCase) -and [string]::Equals($taskExisting.Arguments,$taskOldArgs,[StringComparison]::OrdinalIgnoreCase)
        $taskPriorPS=[string]::Equals($taskExisting.TargetPath,$taskTarget,[StringComparison]::OrdinalIgnoreCase) -and [string]::Equals($taskExisting.Arguments,$taskPreviousPS,[StringComparison]::OrdinalIgnoreCase)
        $taskUpgrade=$taskLegacy -or $taskPriorPS
    }
}
if($Action -eq 'Inspect'){@{path=$taskPath;exists=$taskExists;owned=$taskOwned;target=$taskTarget;arguments=$taskArguments} | ConvertTo-Json -Compress;exit}
if($taskExists -and -not $taskOwned -and -not($Action -eq 'Install' -and $taskUpgrade)){throw 'A different shortcut already uses this name; refusing to change it'}
if($Action -eq 'Remove'){
    if($taskOwned){Remove-Item -LiteralPath $taskPath;Write-Output 'Removed only this project shortcut. Official Codex icons and program files unchanged.'}else{Write-Output 'No owned shortcut to remove.'}
    exit
}
$taskLink=$taskShell.CreateShortcut($taskPath)
if($taskUpgrade){Copy-Item -LiteralPath $taskPath -Destination (Join-Path $taskRoot ('shortcut-backup-'+[DateTime]::Now.ToString('yyyyMMdd-HHmmss')+'.lnk')) -ErrorAction Stop}
$taskLink.TargetPath=$taskTarget
$taskLink.Arguments=$taskArguments
$taskLink.WorkingDirectory=$taskRoot
$taskLink.IconLocation=$Executable+',0'
$taskLink.Description='司天阁V2；七步仪式与欢迎共12秒，独立120/180秒星轨，静音驻守；首次授权可记住，保留首版入口。'
$taskLink.WindowStyle=7
$taskLink.Save()
$taskCheck=$taskShell.CreateShortcut($taskPath)
if($taskCheck.TargetPath -ne $taskTarget -or $taskCheck.Arguments -ne $taskArguments -or -not(Test-Path -LiteralPath $taskPath)){throw 'Shortcut verification failed'}
Write-Output ('Created: '+$taskPath)
