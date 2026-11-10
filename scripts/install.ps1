[CmdletBinding()]
param([string]$Destination=(Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex\SitianCodexV2'))
$ErrorActionPreference='Stop'
$taskProject=Split-Path -Parent $PSScriptRoot
$taskSource=Join-Path $taskProject 'runtime'
$taskDestination=[IO.Path]::GetFullPath($Destination)
if((Split-Path -Leaf $taskDestination) -ne 'SitianCodexV2'){throw 'Choose a dedicated directory named SitianCodexV2; never overwrite either original version'}
if(Test-Path -LiteralPath $taskDestination){throw 'Destination exists; refusing overwrite. Inspect the existing installation first.'}
foreach($taskName in @('startup.mp4','handoff.mp4','wallpaper.mp4','launcher.mjs','integration.mjs','config.json')){if(-not(Test-Path -LiteralPath (Join-Path $taskSource $taskName) -PathType Leaf)){throw ('Missing '+$taskName)}}
$taskTotal=(Get-ChildItem -LiteralPath $taskSource -Filter '*.mp4' | Measure-Object -Property Length -Sum).Sum
if($taskTotal -ge 23*1024*1024){throw 'Combined films exceed 23 MiB'}
New-Item -ItemType Directory -Path $taskDestination | Out-Null
Get-ChildItem -LiteralPath $taskSource | Where-Object {$_.Name -notin @('session.json','local-consent.json','local-install-info.json','exports') -and $_.Extension -ne '.log'} | Copy-Item -Destination $taskDestination -Recurse
Push-Location -LiteralPath $taskDestination
try{
 & node launcher.mjs --probe
 if($LASTEXITCODE -ne 0){throw 'Official package preflight failed; no app launched'}
 & node shortcut.mjs --install
 if($LASTEXITCODE -ne 0){throw 'Shortcut installation failed; no official shortcut changed'}
 & node shortcut.mjs
}finally{Pop-Location}
Write-Output ('Installed: '+$taskDestination)
Write-Output 'Save work, fully exit Codex, then use Codex · 司天阁. Personally read and accept the first YES prompt.'
