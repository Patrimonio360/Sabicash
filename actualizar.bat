@echo off
title SabiCash - Publicar nueva version
color 0A
cd /d "%~dp0"

echo.
echo  ==========================================
echo   SabiCash - Sistema de actualizacion
echo  ==========================================
echo.

:: ── Variables ──
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\Patis\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools
set APK_SRC=android\app\build\outputs\apk\release\app-release.apk
set APK_DST=SabiCash.apk
set VERSION_FILE=version.json
set GITHUB_RAW=https://raw.githubusercontent.com/Patrimonio360/Sabicash/main/version.json
set GITHUB_RELEASES=https://github.com/Patrimonio360/Sabicash/releases/download

:: ── Descargar version.json actualizado desde GitHub ──
echo  Obteniendo version actual desde GitHub...
powershell -Command "Invoke-WebRequest -Uri '%GITHUB_RAW%' -OutFile '%VERSION_FILE%'" >nul 2>&1
if errorlevel 1 (
    echo  AVISO: No se pudo conectar a GitHub. Usando version.json local.
)

:: ── Leer version actual ──
for /f "tokens=2 delims=:, " %%a in ('findstr "version" %VERSION_FILE%') do (
    set CURRENT_VERSION=%%~a
    goto :found_version
)
:found_version
set CURRENT_VERSION=%CURRENT_VERSION:"=%
echo  Version actual en GitHub: %CURRENT_VERSION%
echo.

:: ── Separar major.minor.patch ──
for /f "tokens=1,2,3 delims=." %%a in ("%CURRENT_VERSION%") do (
    set MAJOR=%%a
    set MINOR=%%b
    set PATCH=%%c
)

:: ── Elegir tipo de actualizacion ──
echo  Que tipo de actualizacion es esta?
echo.
echo  [1] PARCHE  (1.0.X) — Correcciones de bugs, pequenas mejoras
echo              Ejemplos: arreglar un fallo, mejorar un texto,
echo              corregir una pregunta incorrecta
echo.
echo  [2] MENOR   (1.X.0) — Nuevas funcionalidades
echo              Ejemplos: nueva asignatura, nuevo tipo de juego,
echo              nueva pantalla, nueva opcion en ajustes
echo.
echo  [3] MAYOR   (X.0.0) — Cambio grande o rediseno
echo              Ejemplos: rediseno completo, cambio de base de datos,
echo              nueva arquitectura, cambio de nombre
echo.
set /p TIPO=" Elige (1/2/3): "

if "%TIPO%"=="1" (
    set /a PATCH=%PATCH%+1
    set TIPO_LABEL=Parche
)
if "%TIPO%"=="2" (
    set /a MINOR=%MINOR%+1
    set PATCH=0
    set TIPO_LABEL=Menor
)
if "%TIPO%"=="3" (
    set /a MAJOR=%MAJOR%+1
    set MINOR=0
    set PATCH=0
    set TIPO_LABEL=Mayor
)

set NEW_VERSION=%MAJOR%.%MINOR%.%PATCH%
set TAG=v%NEW_VERSION%

echo.
echo  Nueva version: %CURRENT_VERSION% → %NEW_VERSION% (%TIPO_LABEL%)
echo.

:: ── Pedir notas de la actualizacion ──
echo  Describe brevemente que cambios incluye esta version:
echo  (Aparecera en el aviso de actualizacion del movil)
echo.
set /p NOTES=" Descripcion: "
echo.

:: ── Confirmacion ──
echo  ==========================================
echo   RESUMEN
echo  ==========================================
echo   Version: %CURRENT_VERSION% → %NEW_VERSION%
echo   Tipo: %TIPO_LABEL%
echo   Notas: %NOTES%
echo  ==========================================
echo.
set /p CONFIRM=" Continuar? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo  Cancelado.
    pause
    exit /b 0
)

:: ── Actualizar APP_VERSION en App.js ANTES de compilar ──
echo.
echo  [0/5] Actualizando version en App.js...
powershell -Command "(Get-Content 'App.js' -Raw) -replace \"const APP_VERSION\s*=\s*'[^']*'\", \"const APP_VERSION     = '%NEW_VERSION%'\" | Set-Content 'App.js' -NoNewline"
echo  App.js actualizado con v%NEW_VERSION%

:: ── Actualizar version.json ANTES de compilar ──
echo  [0/5] Actualizando version.json...
set APK_URL=%GITHUB_RELEASES%/%TAG%/SabiCash.apk
(
echo {
echo   "version": "%NEW_VERSION%",
echo   "url": "%APK_URL%",
echo   "notes": "%NOTES%"
echo }
) > %VERSION_FILE%
echo  version.json actualizado

:: ── Compilar APK ──
echo.
echo  [1/5] Compilando APK...
cd android
call .\gradlew.bat assembleRelease
if errorlevel 1 (
    echo  ERROR en la compilacion.
    cd ..
    pause
    exit /b 1
)
cd ..

:: ── Copiar APK ──
echo.
echo  [2/5] Copiando APK...
copy /Y "%APK_SRC%" "%APK_DST%" >nul
echo  APK listo: %APK_DST%

:: ── Git commit y push ──
echo.
echo  [3/5] Publicando en GitHub...
git add App.js %VERSION_FILE%
git commit -m "release: v%NEW_VERSION% - %NOTES%"
git push origin main
if errorlevel 1 (
    echo  ERROR al hacer push.
    pause
    exit /b 1
)

:: ── Instrucciones Release ──
echo.
echo  ==========================================
echo   BUILD EXITOSO — v%NEW_VERSION%
echo  ==========================================
echo.
echo  ULTIMO PASO — Sube el APK a GitHub Releases:
echo.
echo  1. Abre: https://github.com/Patrimonio360/Sabicash/releases/new
echo  2. Tag:  %TAG%
echo  3. Sube: %CD%\%APK_DST%
echo  4. Publica el release
echo.
echo  Todos los moviles veran el aviso al abrir la app.
echo.

pause
