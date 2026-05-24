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
set GITHUB_URL=https://github.com/Patrimonio360/Sabicash/releases/download

:: ── Leer version actual ──
for /f "tokens=2 delims=:, " %%a in ('findstr "version" %VERSION_FILE%') do (
    set CURRENT_VERSION=%%~a
    goto :found_version
)
:found_version
echo  Version actual: %CURRENT_VERSION%
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
echo  Nueva version: %NEW_VERSION% (%TIPO_LABEL%)
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

:: ── Compilar APK ──
echo.
echo  [1/4] Compilando APK...
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
echo  [2/4] Copiando APK...
copy /Y "%APK_SRC%" "%APK_DST%" >nul
echo  APK copiado: %APK_DST%

:: ── Actualizar version.json ──
echo.
echo  [3/4] Actualizando version.json...
set APK_URL=%GITHUB_URL%/%TAG%/SabiCash.apk
(
echo {
echo   "version": "%NEW_VERSION%",
echo   "url": "%APK_URL%",
echo   "notes": "%NOTES%"
echo }
) > %VERSION_FILE%
echo  version.json actualizado con v%NEW_VERSION%

:: ── Actualizar APP_VERSION en App.js ──
powershell -Command "(Get-Content 'App.js') -replace 'const APP_VERSION\s*=\s*''[^'']*''', 'const APP_VERSION     = ''%NEW_VERSION%''' | Set-Content 'App.js'"
echo  App.js actualizado con v%NEW_VERSION%

:: ── Git commit y push ──
echo.
echo  [4/4] Publicando en GitHub...
git add App.js %VERSION_FILE%
git commit -m "release: v%NEW_VERSION% - %NOTES%"
git push origin main
if errorlevel 1 (
    echo  ERROR al hacer push. Revisa tu conexion o credenciales de GitHub.
    pause
    exit /b 1
)

:: ── Instrucciones para subir el APK a GitHub Releases ──
echo.
echo  ==========================================
echo   BUILD EXITOSO
echo  ==========================================
echo.
echo   APK listo: %CD%\%APK_DST%
echo   Version:   %NEW_VERSION%
echo.
echo   ULTIMO PASO — Sube el APK a GitHub Releases:
echo   1. Abre: %GITHUB_URL:\=/%
echo      (quita el /download del final)
echo   2. Pulsa "Create a new release"
echo   3. Tag: %TAG%
echo   4. Sube el archivo: %APK_DST%
echo   5. Publica el release
echo.
echo   Cuando lo publiques, todos los moviles
echo   veran el aviso de actualizacion al abrir la app.
echo.

pause
