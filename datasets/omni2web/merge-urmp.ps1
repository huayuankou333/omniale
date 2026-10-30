$ErrorActionPreference = 'Stop'
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'urmp-parts.json') -Raw | ConvertFrom-Json
$output = Join-Path $PSScriptRoot $manifest.name
if (Test-Path -LiteralPath $output) { throw 'Output ZIP already exists; refusing to overwrite it.' }
foreach ($part in $manifest.parts) {
    $partPath = Join-Path $PSScriptRoot $part.name
    $digest = (Get-FileHash -LiteralPath $partPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($digest -ne $part.sha256) { throw "Part hash mismatch: $($part.name)" }
}
$destination = [System.IO.File]::Open($output, [System.IO.FileMode]::CreateNew)
try {
    foreach ($part in $manifest.parts) {
        $source = [System.IO.File]::OpenRead((Join-Path $PSScriptRoot $part.name))
        try { $source.CopyTo($destination) } finally { $source.Dispose() }
    }
} finally { $destination.Dispose() }
$wholeHash = (Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash.ToLowerInvariant()
if ($wholeHash -ne $manifest.sha256) { throw 'Merged ZIP hash differs.' }
Write-Output "Verified ZIP: $output"
Write-Output "SHA256: $wholeHash"
