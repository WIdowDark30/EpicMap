$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
# Load only the discovery function, without invoking the interactive installer.
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $repo 'install.ps1'), [ref]$null, [ref]$null)
$definition = $ast.Find({ param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Find-Lich' }, $true)
Invoke-Expression $definition.Extent.Text
$fixture = Join-Path $repo ('dist/discovery-' + [guid]::NewGuid())
$nested = Join-Path $fixture 'OneDrive - Test/Desktop/Lich5/Lich5'
New-Item -ItemType Directory -Path $nested -Force | Out-Null
New-Item -ItemType File -Path (Join-Path $nested 'lich.rbw') | Out-Null
$desktop = Join-Path $fixture 'OneDrive - Test/Desktop'
$found = @(Find-Lich @($desktop, $desktop))
if ($found.Count -ne 1 -or $found[0] -ne $nested) { throw 'Nested OneDrive discovery or deduplication failed' }
$second = Join-Path $fixture 'Other Lich'
New-Item -ItemType Directory -Path $second -Force | Out-Null
New-Item -ItemType File -Path (Join-Path $second 'lich.rb') | Out-Null
if (@(Find-Lich @($desktop, $second)).Count -ne 2) { throw 'Multiple Lich installations were not detected' }
Write-Host 'Installer discovery checks passed.'
