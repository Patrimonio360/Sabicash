@echo off
title SabiCash - Compilar APK
color 0A

echo.
echo  ==========================================
echo   SabiCash - Compilacion de APK (v2)
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
    echo  ERROR: No se encuentra el Android SDK en:
    echo         %ANDROID_HOME%
    echo  Ajusta la variable ANDROID_HOME al inicio del bat si tu SDK esta en otra ruta.
    pause
    exit /b 1
)

:: ── Verificar que Node este instalado ──
where node >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js no esta instalado o no esta en el PATH.
    pause
    exit /b 1
)

:: ── Instalar dependencias si no existe node_modules ──
if not exist "node_modules" (
    echo  [0/4] Instalando dependencias npm...
    call npm install
    if errorlevel 1 (
        echo  ERROR instalando dependencias.
        pause
        exit /b 1
    )
)

:: ── PASO CLAVE: Generar carpeta android/ si no existe (expo prebuild) ──
if not exist "android" (
    echo  [1/4] Generando proyecto Android nativo con expo prebuild...
    call npx expo prebuild --platform android --clean
    if errorlevel 1 (
        echo  ERROR en expo prebuild. Revisa que tienes expo instalado.
        pause
        exit /b 1
    )
    echo  Proyecto Android generado correctamente.
) else (
    echo  [1/4] Carpeta android/ ya existe, omitiendo prebuild.
)

:: ── Crear local.properties con la ruta del SDK ──
echo sdk.dir=%ANDROID_HOME:\=\\%> android\local.properties
echo  local.properties actualizado.

:: ── Desactivar minificacion que puede romper React Native en algunos builds ──
echo  [2/4] Configurando build.gradle...
powershell -Command ^
  "(Get-Content 'android\app\build.gradle' -Raw) ^
  -replace 'minifyEnabled \(enableProguardInReleaseBuilds\)', 'minifyEnabled false' ^
  -replace 'minifyEnabled true', 'minifyEnabled false' ^
  | Set-Content 'android\app\build.gradle'"

:: ── Compilar APK (Gradle genera el bundle JS automaticamente) ──
echo.
echo  [3/4] Compilando APK con Gradle...
echo         (Esto puede tardar 3-10 minutos la primera vez)
cd android
call .\gradlew.bat assembleRelease
if errorlevel 1 (
    echo.
    echo  ERROR en la compilacion. Revisa los mensajes arriba.
    echo  Consejo: si falla por JAVA, asegurate de que JAVA_HOME apunta al JDK de Android Studio.
    cd ..
    pause
    exit /b 1
)
cd ..

:: ── Copiar APK al directorio del proyecto ──
echo.
echo  [4/4] Copiando APK...
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    copy /Y "android\app\build\outputs\apk\release\app-release.apk" "SabiCash.apk" >nul
    echo.
    echo  ==========================================
    echo   BUILD EXITOSO
    echo  ==========================================
    echo.
    echo   APK listo: %CD%\SabiCash.apk
    echo.
    echo   Instalar en el Redmi 10C:
    echo   1. Copia SabiCash.apk al movil por USB o WhatsApp
    echo   2. En MIUI: Ajustes ^> Privacidad ^> Instalar apps desconocidas
    echo      y activa el permiso para la app desde la que abres el APK
    echo   3. Abre el archivo en el movil
    echo   4. Pulsa Instalar
    echo.
) else (
    echo  No se encontro el APK generado.
    echo  Revisa android\app\build\outputs\apk\release\
)

pause
