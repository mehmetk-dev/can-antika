Param(
    [string]$OutputPath = "audit/secret-scan.txt"
)

$ErrorActionPreference = "Stop"

$patterns = @(
    "AKIA[0-9A-Z]{16}",
    "ASIA[0-9A-Z]{16}",
    "-----BEGIN (RSA|EC|OPENSSH|DSA) PRIVATE KEY-----",
    "xox[baprs]-[0-9A-Za-z-]{10,}",
    "(?i)(api[_-]?key|secret|token|password)\\s*[:=]\\s*['\""][^'\""]{8,}['\""]",
    "(?i)ghp_[0-9A-Za-z]{30,}",
    "(?i)AIza[0-9A-Za-z\\-_]{35}"
)

$outputDirectory = Split-Path -Path $OutputPath -Parent
if (-not [string]::IsNullOrWhiteSpace($outputDirectory) -and -not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$trackedFiles = git -c core.quotepath=false ls-files
$results = New-Object System.Collections.Generic.List[string]

foreach ($file in $trackedFiles) {
    $normalizedFile = $file.Trim()
    if ([string]::IsNullOrWhiteSpace($normalizedFile)) { continue }
    if ($normalizedFile -match "node_modules/") { continue }
    if ($normalizedFile -match "\\.min\\.(js|css)$") { continue }
    if (-not (Test-Path -LiteralPath $normalizedFile)) { continue }

    foreach ($pattern in $patterns) {
        $matches = Select-String -LiteralPath $normalizedFile -Pattern $pattern -AllMatches -Encoding utf8 -ErrorAction SilentlyContinue
        foreach ($m in $matches) {
            $results.Add("$($m.Path):$($m.LineNumber):$($m.Line.Trim())")
        }
    }
}

$sortedResults = $results | Sort-Object -Unique
if ($sortedResults.Count -eq 0) {
    @("No secret pattern match found.") | Set-Content -Path $OutputPath -Encoding utf8
} else {
    $sortedResults | Set-Content -Path $OutputPath -Encoding utf8
}
Write-Host "Secret scan report: $OutputPath"
