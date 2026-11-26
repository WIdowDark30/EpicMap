[CmdletBinding()]
param([string]$LichPath, [string]$PackagePath = $PSScriptRoot)
$ErrorActionPreference = 'Stop'

function Find-Lich([string[]]$Roots) {
    $found = @()
    foreach ($root in $Roots | Where-Object { $_ } | Select-Object -Unique) {
        if (!(Test-Path -LiteralPath $root -PathType Container)) { continue }
        $queue = @(@{ Path = $root; Depth = 0 })
        while ($queue.Count) {
            $item = $queue[0]
            $queue = @($queue | Select-Object -Skip 1)
            if ((Test-Path -LiteralPath (Join-Path $item.Path 'lich.rbw')) -or
                (Test-Path -LiteralPath (Join-Path $item.Path 'lich.rb'))) {
                $found += (Get-Item -LiteralPath $item.Path).FullName
                continue
            }
            if ($item.Depth -ge 3) { continue }
            foreach ($child in Get-ChildItem -LiteralPath $item.Path -Directory -ErrorAction SilentlyContinue) {
                if (!($child.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
                    $queue += @{ Path = $child.FullName; Depth = $item.Depth + 1 }
                }
            }
        }
    }
    @($found | Sort-Object -Unique)
}

try {
    $map = Join-Path $PackagePath 'EpicMap'
    $launcher = Join-Path $PackagePath 'scripts/epicmap.lic'
    foreach ($required in @('index.html','app.js','gs4map-data.js','maps')) {
        if (!(Test-Path -LiteralPath (Join-Path $map $required))) {
            throw "Incomplete package: missing EpicMap/$required. Extract the complete Windows ZIP, then run Install-EpicMap.cmd inside the extracted folder."
        }
    }
    if (!(Test-Path -LiteralPath $launcher -PathType Leaf)) { throw 'Package is missing scripts/epicmap.lic.' }
    if (!$LichPath) {
        $roots = @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('MyDocuments'),
            "$env:USERPROFILE\Downloads", "$env:USERPROFILE\Lich5", 'C:\Lich5')
        foreach ($drive in @($env:OneDrive,$env:OneDriveConsumer,$env:OneDriveCommercial)) {
            if ($drive) { $roots += "$drive\Desktop"; $roots += "$drive\Documents" }
        }
        $candidates = @(Find-Lich $roots)
        if ($candidates.Count -eq 1) { $LichPath = $candidates[0] }
        elseif ($candidates.Count -gt 1) {
            for ($i=0; $i -lt $candidates.Count; $i++) { Write-Host "$($i+1). $($candidates[$i])" }
            $answer = Read-Host 'Choose the Lich installation number'
            $number = 0
            if (![int]::TryParse($answer, [ref]$number) -or $number -lt 1 -or $number -gt $candidates.Count) { throw 'Invalid selection. Run again and choose a listed number.' }
            $LichPath = $candidates[$number-1]
        } else { $LichPath = (Read-Host 'Enter your Lich folder (the folder containing lich.rbw)').Trim('"') }
    }
    $LichPath = (Get-Item -LiteralPath $LichPath).FullName
    if (!(Test-Path -LiteralPath (Join-Path $LichPath 'lich.rbw')) -and !(Test-Path -LiteralPath (Join-Path $LichPath 'lich.rb'))) {
        throw "Not a Lich installation: $LichPath. Choose the folder containing lich.rbw or lich.rb."
    }
    $destination = Join-Path $LichPath 'EpicMap'
    if ([IO.Path]::GetFullPath($map).TrimEnd('\') -eq [IO.Path]::GetFullPath($destination).TrimEnd('\')) { throw 'Extract the installer outside your Lich folder before running it.' }
    $backup = Join-Path $LichPath ('epicmap-backup-' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss-ffff'))
    New-Item -ItemType Directory -Path $backup | Out-Null
    if (Test-Path -LiteralPath $destination) { Copy-Item -LiteralPath $destination -Destination $backup -Recurse }
    $scripts = Join-Path $LichPath 'scripts'
    New-Item -ItemType Directory -Path $scripts -Force | Out-Null
    $installedLauncher = Join-Path $scripts 'epicmap.lic'
    if (Test-Path -LiteralPath $installedLauncher) { Copy-Item -LiteralPath $installedLauncher -Destination $backup }
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Get-ChildItem -LiteralPath $map | Copy-Item -Destination $destination -Recurse -Force
    Copy-Item -LiteralPath $launcher -Destination $installedLauncher -Force
    Write-Host "Installed EpicMap in $destination"
    Write-Host "Backup: $backup"
    Write-Host 'In game: ;kill epicmap (if running), then ;epicmap. Reload your browser with Ctrl+F5.'
} catch {
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Existing files are backed up before replacement. If copying failed, restore from the epicmap-backup folder in Lich.'
    exit 1
}
