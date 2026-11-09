@echo off
cd /d "%~dp0"
title SabiCash - Compilar y Publicar
color 0A

echo.
echo  ==========================================
echo   SabiCash - Compilar y Publicar APK
echo  ==========================================
echo.

:: ── Variables ──
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\Patis\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools

:: ── Verificaciones basicas ──
if not exist "package.json" (
    echo  ERROR: Ejecuta desde la carpeta del proyecto.
    pause & exit /b 1
)
if not exist "%ANDROID_HOME%" (
    echo  ERROR: Android SDK no encontrado.
    pause & exit /b 1
)

:: ── Pedir descripcion del cambio ──
echo  Describe brevemente que cambia en esta version:
set /p NOTES=" Descripcion: "
echo.

:: ── [1/6] Auto-incrementar version ──
echo  [1/6] Actualizando version...

echo $j = Get-Content 'app.json' -Raw ^| ConvertFrom-Json > _update.ps1
echo $parts = $j.expo.version -split '\.' >> _update.ps1
echo $parts[2] = [int]$parts[2] + 1 >> _update.ps1
echo $newVer = $parts -join '.' >> _update.ps1
echo $j.expo.version = $newVer >> _update.ps1
echo $j.expo.android.versionCode = $j.expo.android.versionCode + 1 >> _update.ps1
echo $j ^| ConvertTo-Json -Depth 10 ^| Set-Content 'app.json' >> _update.ps1
echo $v = Get-Content 'version.json' -Raw ^| ConvertFrom-Json >> _update.ps1
echo $v.version = $newVer >> _update.ps1
echo $v.notes = '%NOTES%' >> _update.ps1
echo $v ^| ConvertTo-Json ^| Set-Content 'version.json' >> _update.ps1
echo Write-Host "  Version actualizada a: $newVer" >> _update.ps1

powershell -ExecutionPolicy Bypass -File _update.ps1
del _update.ps1
echo.

:: ── [2/6] Generar android/ si no existe ──
if not exist "android" (
    echo  [2/6] Generando proyecto Android con expo prebuild...
    call npx expo prebuild --platform android --clean
    if errorlevel 1 ( echo  ERROR en prebuild. & pause & exit /b 1 )
) else (
    echo  [2/6] Carpeta android/ ok.
)

:: ── local.properties ──
echo sdk.dir=%ANDROID_HOME:\=\\%> android\local.properties

:: ── Desactivar minificacion ──
powershell -ExecutionPolicy Bypass -Command "(Get-Content 'android\app\build.gradle' -Raw) -replace 'minifyEnabled \(enableProguardInReleaseBuilds\)', 'minifyEnabled false' -replace 'minifyEnabled true', 'minifyEnabled false' | Set-Content 'android\app\build.gradle'"

:: ── [3/6] Compilar APK ──
echo.
echo  [3/6] Compilando APK (puede tardar 5-10 min)...
cd android
call .\gradlew.bat clean assembleRelease
if errorlevel 1 (
    echo  ERROR en la compilacion.
    cd .. & pause & exit /b 1
)
cd ..

:: ── [4/6] Copiar APK ──
echo.
echo  [4/6] Copiando APK...
if not exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo  ERROR: No se genero el APK.
    pause & exit /b 1
)
copy /Y "android\app\build\outputs\apk\release\app-release.apk" "SabiCash.apk" >nul
echo  SabiCash.apk listo.

:: ── [5/6] Git pull + push ──
echo.
echo  [5/6] Sincronizando y publicando en GitHub...
git.exe pull origin main --rebase
git add .
for /f "tokens=*" %%v in ('powershell -Command "(Get-Content 'app.json' -Raw | ConvertFrom-Json).expo.version"') do set VER=%%v
git commit -m "release: v%VER% - %NOTES%"
git.exe push origin main
if errorlevel 1 (
    echo  AVISO: Push fallido. Ejecuta manualmente: git.exe push origin main
)

:: ── [6/6] Menu final ──
echo.
echo  ==========================================
echo   LISTO - v%VER% compilada y publicada
echo  ==========================================
echo.
echo   APK: %CD%\SabiCash.apk
echo.
echo  Que quieres hacer ahora?
echo.
echo  [1] Probar con Expo Go (abre QR para escanear con el movil)
echo  [2] Enviar APK por WhatsApp
echo  [3] Abrir carpeta con el APK
echo  [4] Salir
echo.
set /p OPCION=" Elige (1/2/3/4): "

if "%OPCION%"=="1" (
    echo  Iniciando Expo Go...
    start cmd /k "cd /d %CD% && npx expo start"
)
if "%OPCION%"=="2" (
    explorer /select,"%CD%\SabiCash.apk"
    start https://web.whatsapp.com
    echo  Carpeta abierta y WhatsApp Web listo. Adjunta el APK.
)
if "%OPCION%"=="3" (
    explorer /select,"%CD%\SabiCash.apk"
)

echo.
pause