param(
    [switch]$Setup,
    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"

function Invoke-InProject {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$RelativePath,
        [Parameter(Mandatory = $true)]
        [string[]]$Command
    )

    $projectPath = Join-Path $PSScriptRoot $RelativePath

    if (-not (Test-Path -LiteralPath $projectPath)) {
        throw "Project path not found: $projectPath"
    }

    Write-Host "[$Name] $($Command -join ' ')" -ForegroundColor Cyan

    Push-Location $projectPath
    try {
        & $Command[0] $Command[1..($Command.Length - 1)]
    }
    finally {
        Pop-Location
    }
}

function ConvertTo-SingleQuotedLiteral {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    return "'" + $Value.Replace("'", "''") + "'"
}

$projects = @(
    @{
        Name = "Backend"
        RelativePath = "backend"
    },
    @{
        Name = "CustomerFacingApp"
        RelativePath = "CustomerFacingApp"
    },
    @{
        Name = "CompanyFacingApp"
        RelativePath = "CompanyFacingApp"
    }
)

if ($Setup) {
    foreach ($project in $projects) {
        Invoke-InProject -Name $project.Name -RelativePath $project.RelativePath -Command @("npm", "install")
    }

    Invoke-InProject -Name "Backend" -RelativePath "backend" -Command @("npm", "run", "prisma:generate")
    Invoke-InProject -Name "Backend" -RelativePath "backend" -Command @("npm", "run", "prisma:push")

    if (-not $SkipSeed) {
        Invoke-InProject -Name "Backend" -RelativePath "backend" -Command @("npm", "run", "prisma:seed")
    }
}

$backendEnvPath = Join-Path $PSScriptRoot "backend\.env"
if (-not (Test-Path -LiteralPath $backendEnvPath)) {
    Write-Warning "backend\\.env was not found. Copy backend\\.env.example to backend\\.env before starting the apps."
}

foreach ($project in $projects) {
    $projectPath = Join-Path $PSScriptRoot $project.RelativePath
    $quotedPath = ConvertTo-SingleQuotedLiteral -Value $projectPath
    $windowTitle = $project.Name.Replace("'", "''")
    $message = "Running npm run dev in $($project.RelativePath)".Replace("'", "''")
    $command = @"
Set-Location -LiteralPath $quotedPath
`$host.UI.RawUI.WindowTitle = '$windowTitle'
Write-Host '$message' -ForegroundColor Green
npm run dev
"@

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", $command
    ) | Out-Null
}

Write-Host "Started backend, customer app, and company app in separate PowerShell windows." -ForegroundColor Green
if ($Setup) {
    Write-Host "Setup completed before launch." -ForegroundColor Green
}
