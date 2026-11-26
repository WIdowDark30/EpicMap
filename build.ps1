param([string]$BaselineZip, [string]$OutputDirectory = "$PSScriptRoot/dist")
$ErrorActionPreference = 'Stop'
if (!$BaselineZip) { throw 'Supply -BaselineZip pointing to the complete epicmap-v1.2.5.zip release download.' }
$expected = 'b0a0e31003e5688a5b73ef7f6b4bf5a826b5be5d37ffe79473db0b35f40d8679'
if ((Get-FileHash -LiteralPath $BaselineZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Baseline SHA-256 mismatch. Download the official full v1.2.5 ZIP.' }
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$stage = Join-Path $OutputDirectory ('stage-' + [guid]::NewGuid())
Expand-Archive -LiteralPath $BaselineZip -DestinationPath $stage
Copy-Item -LiteralPath "$stage/README.md" -Destination "$stage/MAP-CREDITS-AND-README.txt"
Copy-Item -LiteralPath "$PSScriptRoot/scripts/epicmap.lic" -Destination "$stage/scripts/epicmap.lic" -Force
foreach ($file in @('install.ps1','Install-EpicMap.cmd','README.md')) { Copy-Item -LiteralPath "$PSScriptRoot/$file" -Destination $stage -Force }
'Extract the entire Windows ZIP, then double-click Install-EpicMap.cmd. See README.md for manual installation and troubleshooting. Map and artwork credits are in MAP-CREDITS-AND-README.txt.' | Set-Content -LiteralPath "$stage/INSTALL-UPDATE.txt"
'Version 1.2.6: Windows installer, nested folder discovery and persistent launcher directory override. Map features are unchanged from 1.2.5.' | Set-Content -LiteralPath "$stage/UPDATE.txt"
$metadata = Get-Content -LiteralPath "$stage/package.json" -Raw | ConvertFrom-Json
$metadata.version = '1.2.6'
$metadata | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath "$stage/package.json"
$zip = Join-Path $OutputDirectory 'epicmap-v1.2.6-windows.zip'
Compress-Archive -Path "$stage/*" -DestinationPath $zip -Force
$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  epicmap-v1.2.6-windows.zip" | Set-Content -LiteralPath (Join-Path $OutputDirectory 'SHA256SUMS.txt') -Encoding ascii
Write-Host "Built $zip"
