param(
    [Parameter(Position = 0)]
    [ValidateSet('doctor', 'setup', 'emulator', 'build', 'install')]
    [string]$Action = 'doctor'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$sdkCandidates = @(
    $env:ANDROID_SDK_ROOT,
    $env:ANDROID_HOME,
    (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
) | Where-Object { $_ -and (Test-Path (Join-Path $_ 'platform-tools\adb.exe')) }

if (-not $sdkCandidates) {
    throw 'Android SDK platform-tools were not found. Install Android Studio or Android command-line tools, then set ANDROID_HOME.'
}

$sdkRoot = $sdkCandidates[0]
$javaHomeCandidates = @(
    $env:JAVA_HOME,
    (Join-Path $env:LOCALAPPDATA 'Programs\Microsoft\jdk-21-rentph')
)

if (Test-Path (Join-Path $env:LOCALAPPDATA 'Programs\Microsoft')) {
    $javaHomeCandidates += Get-ChildItem (Join-Path $env:LOCALAPPDATA 'Programs\Microsoft') -Directory -Filter 'jdk-21*' |
        Select-Object -ExpandProperty FullName
}

$javaHome = $null
foreach ($candidate in ($javaHomeCandidates | Where-Object { $_ } | Select-Object -Unique)) {
    $javaExecutable = Join-Path $candidate 'bin\java.exe'
    if (-not (Test-Path $javaExecutable)) {
        continue
    }

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $versionOutput = (& $javaExecutable -version 2>&1 | Out-String)
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    if ($versionOutput -match 'version "(?<major>\d+)') {
        if ([int]$Matches.major -ge 21) {
            $javaHome = $candidate
            break
        }
    }
}

if (-not $javaHome) {
    throw 'JDK 21 or newer is required. Install a JDK 21 ZIP under %LOCALAPPDATA%\Programs\Microsoft\jdk-21-* or set JAVA_HOME to JDK 21.'
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:PATH = "$sdkRoot\platform-tools;$sdkRoot\emulator;$sdkRoot\cmdline-tools\latest\bin;$javaHome\bin;$env:PATH"
$adb = Join-Path $sdkRoot 'platform-tools\adb.exe'
$emulator = Join-Path $sdkRoot 'emulator\emulator.exe'
$sdkManager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'
$avdManager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\avdmanager.bat'
$avdName = if ($env:RENTPH_ANDROID_AVD) { $env:RENTPH_ANDROID_AVD } else { 'TMT_API_35' }

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE`: $FilePath $($Arguments -join ' ')"
    }
}

function Get-ConfiguredAvds {
    if (-not (Test-Path $avdManager)) {
        return @()
    }

    $output = & $avdManager list avd 2>&1
    return @($output | ForEach-Object {
        if ($_ -match '^\s*Name:\s*(.+)$') {
            $Matches[1].Trim()
        }
    })
}

Push-Location $repoRoot
try {
    switch ($Action) {
        'doctor' {
            Invoke-CheckedCommand 'npx.cmd' @('cap', 'doctor')
            Write-Host "JDK: $javaHome"
            Write-Host "Android SDK: $sdkRoot"
            Write-Host "Configured AVDs: $((Get-ConfiguredAvds) -join ', ')"
            & $adb devices -l
        }
        'setup' {
            if (-not (Test-Path $sdkManager) -or -not (Test-Path $avdManager)) {
                throw 'Android command-line tools are missing. Install Android Studio or Android SDK Command-line Tools first.'
            }

            $packages = @(
                'platform-tools',
                'emulator',
                'platforms;android-35',
                'build-tools;35.0.0',
                'system-images;android-35;google_apis;x86_64'
            )
            Invoke-CheckedCommand $sdkManager (@("--sdk_root=$sdkRoot", '--install') + $packages)

            $avds = Get-ConfiguredAvds
            if ($avdName -notin $avds) {
                Invoke-CheckedCommand $avdManager @(
                    'create', 'avd', '--name', $avdName,
                    '--package', 'system-images;android-35;google_apis;x86_64',
                    '--device', 'pixel_6', '--force'
                )
            }

            Write-Host "Android SDK and AVD '$avdName' are ready. Run npm run android:emulator, wait for Android to finish booting, then run npm run android:install."
        }
        'emulator' {
            if (-not (Test-Path $emulator)) {
                throw 'Android emulator is missing. Run npm run android:setup.'
            }
            if ($avdName -notin (Get-ConfiguredAvds)) {
                throw "AVD '$avdName' was not found. Run npm run android:setup or set RENTPH_ANDROID_AVD to an installed AVD name."
            }

            Start-Process -FilePath $emulator -ArgumentList @('-avd', $avdName)
            Write-Host "Started AVD '$avdName'. Wait for its home screen before running npm run android:install."
        }
        'build' {
            Invoke-CheckedCommand 'npm.cmd' @('run', 'build')
            Invoke-CheckedCommand 'npx.cmd' @('cap', 'sync', 'android')
            Push-Location (Join-Path $repoRoot 'android')
            try {
                Invoke-CheckedCommand '.\gradlew.bat' @('assembleDebug')
            } finally {
                Pop-Location
            }
            Write-Host "APK: $repoRoot\android\app\build\outputs\apk\debug\app-debug.apk"
        }
        'install' {
            $devices = @(& $adb devices | Where-Object { $_ -match '^\S+\s+device$' })
            if (-not $devices) {
                throw 'No online Android device found. Run npm run android:emulator, wait for the AVD to boot, and retry.'
            }

            Invoke-CheckedCommand 'npm.cmd' @('run', 'build')
            Invoke-CheckedCommand 'npx.cmd' @('cap', 'sync', 'android')
            Push-Location (Join-Path $repoRoot 'android')
            try {
                Invoke-CheckedCommand '.\gradlew.bat' @('installDebug')
            } finally {
                Pop-Location
            }
            Invoke-CheckedCommand $adb @('shell', 'monkey', '-p', 'com.rentph.app', '-c', 'android.intent.category.LAUNCHER', '1')
        }
    }
} finally {
    Pop-Location
}