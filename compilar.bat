@echo off
title SabiCash - Compilar APK
color 0A

echo.
echo  ==========================================
echo   SabiCash - Compilacion de APK
echo  ==========================================
echo.

:: ── Variables de entorno ──
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\Patis\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator

:: ── Verificar carpeta correcta ──
if not exist "package.json" (
    echo  ERROR: Ejecuta este archivo desde la carpeta sabicash
    pause
    exit /b 1
)

:: ── Verificar Android SDK ──
if not exist "%ANDROID_HOME%" (
    echo  ERROR: No se encuentra el Android SDK en %ANDROID_HOME%
    pause
    exit /b 1
)

:: ── Verificar Node ──
where node >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js no esta instalado o no esta en el PATH.
    pause
    exit /b 1
)

:: ── AUTO-INCREMENTAR VERSION en app.json y version.json ──
echo  [0/5] Actualizando version automaticamente...
powershell -ExecutionPolicy Bypass -Command ^
  "$appJson = Get-Content 'app.json' -Raw | ConvertFrom-Json; " ^
  "$parts = $appJson.expo.version -split '\.'; " ^
  "$parts[2] = [int]$parts[2] + 1; " ^
  "$newVersion = $parts -join '.'; " ^
  "$appJson.expo.version = $newVersion; " ^
  "$appJson.expo.android.versionCode = $appJson.expo.android.versionCode + 1; " ^
  "$appJson | ConvertTo-Json -Depth 10 | Set-Content 'app.json'; " ^
  "$verJson = Get-Content 'version.json' -Raw | ConvertFrom-Json; " ^
  "$verJson.version = $newVersion; " ^
  "$verJson.notes = 'Actualizacion automatica'; " ^
  "$verJson | ConvertTo-Json | Set-Content 'version.json'; " ^
  "Write-Host '  Version actualizada a: ' $newVersion"

if errorlevel 1 (
    echo  ERROR actualizando version. Revisa que app.json y version.json existen.
    pause
    exit /b 1
)

:: ── Instalar dependencias si no existe node_modules ──
if not exist "node_modules" (
    echo  [1/5] Instalando dependencias npm...
    call npm install
    if errorlevel 1 (
        echo  ERROR instalando dependencias.
        pause
        exit /b 1
    )
)

:: ── Generar carpeta android/ si no existe ──
if not exist "android" (
    echo  [2/5] Generando proyecto Android nativo con expo prebuild...
    call npx expo prebuild --platform android --clean