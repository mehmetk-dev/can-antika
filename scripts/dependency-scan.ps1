Param(
    [string]$OutputDir = "audit"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

Push-Location can-antika-frontend
try {
    npm audit --omit=dev --json | Out-File -FilePath "..\\$OutputDir\\frontend-npm-audit.json" -Encoding utf8
} catch {
    Write-Warning "npm audit returned non-zero status (issues found or npm error). Output still captured when possible."
}
Pop-Location

Push-Location e-commerce
try {
    $dependencyCheckArgs = @(
        "org.owasp:dependency-check-maven:check",
        "-Dformat=JSON",
        "-DfailOnError=false",
        "-DskipTests"
    )
    $backendReportPath = "target\\dependency-check-report.json"

    if (Test-Path -LiteralPath $backendReportPath) {
        Remove-Item -LiteralPath $backendReportPath -Force
    }

    .\\mvnw.cmd @dependencyCheckArgs
    if (-not (Test-Path -LiteralPath $backendReportPath)) {
        Write-Warning "Dependency-Check report not produced (likely NVD rate-limit). Retrying with local database only (autoUpdate=false)."
        .\\mvnw.cmd @dependencyCheckArgs -DautoUpdate=false
    }

    if (Test-Path -LiteralPath $backendReportPath) {
        Copy-Item $backendReportPath "..\\$OutputDir\\backend-dependency-check.json" -Force
    } else {
        Write-Warning "Backend dependency report could not be generated."
    }
} finally {
    Pop-Location
}

Write-Host "Dependency scan outputs saved under: $OutputDir"
