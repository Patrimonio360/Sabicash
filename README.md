# SabiCash 💰

> App Android educativa que gamifica la gestión de la paga mensual para niños y adolescentes.

**Desarrollado por [Patrimonio 360](https://patrimonio360.pro)**

---

## ¿Qué es SabiCash?

SabiCash enseña a los niños a gestionar su dinero de forma responsable combinando dos mecánicas:

- **🎮 Juegos educativos** — Preguntas tipo test y de desarrollo generadas por IA (Groq) sobre todas las asignaturas del currículo LOMLOE español. Responder correctamente genera puntos que se convierten en céntimos reales.
- **💰 Gestión de la paga** — El alumno registra sus gastos. Si gasta más del 50% de su paga mensual, la siguiente se reduce o elimina como penalización.

---

## Características principales

### Para el alumno
- 🏫 Compatible con todos los cursos de Primaria, ESO y Bachillerato
- 📚 Asignaturas: Matemáticas, Lengua, Inglés, C. Naturales, C. Sociales, Historia, Geografía, Música, Ed. Artística, Tecnología, Valores Éticos, Filosofía, Cultura General y segundo idioma (Francés, Alemán, Italiano, Portugués o Chino)
- 🎯 **Ronda Especial** — preguntas de todas las asignaturas mezcladas con bonus de 0,50 € o penalización de 0,30 €
- ⭐ Sistema de puntos: 50 pts = 0,10 €
- 🔥 Racha diaria de juego
- 📅 Una ronda por asignatura al día
- 🏆 Mínimo 75% de aciertos para ganar puntos

### Para los padres (zona protegida por PIN)
- 📊 Estadísticas de rendimiento por asignatura con gráficas de aciertos/errores
- 🚨 Alertas de gasto excesivo
- 💶 Añadir dinero manualmente para premios especiales
- 🎓 Cambiar el curso del alumno
- 🔄 Reinicio completo de la app

### Sistema de paga
- Paga base: **10 €/mes**
- Límite de gasto sin penalización: **50% de la paga**
- Si se supera el límite → paga siguiente = **0 €**
- Recuperación progresiva: 2 € → 4 € → 6 € → 8 € → 10 €
- El botón de cobrar solo está disponible **una vez al mes**

---

## Stack técnico

| Tecnología | Uso |
|---|---|
| React Native + Expo SDK 54 | Framework móvil |
| Groq (llama-3.1-8b-instant) | Generación de preguntas con IA |
| AsyncStorage | Persistencia local |
| React Navigation v6 | Navegación |
| expo-secure-store | Almacenamiento seguro |

---

## Instalación y desarrollo

### Requisitos
- Node.js 18+
- Android Studio (para compilar APK)
- Cuenta en [Groq](https://console.groq.com) (gratuita)

### Configuración
```bash
# 1. Clonar el repo
git clone https://github.com/Patisporelmundo/SabiCash.git
cd SabiCash

# 2. Instalar dependencias
npm install

# 3. Configurar API key de Groq
# Edita src/config.js y añade tu key
```

```js
// src/config.js
export const GROQ_API_KEY = 'tu_key_de_groq';
export const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL   = 'llama-3.1-8b-instant';
```

```bash
# 4. Ejecutar en modo desarrollo
npx expo start
# Escanea el QR con Expo Go (Android)
```

### Compilar APK
```powershell
# Generar proyecto Android (primera vez)
npx expo prebuild --platform android --clean

# Compilar APK de release
cd android
.\gradlew.bat assembleRelease

# El APK se genera en:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## Actualizaciones

La app comprueba automáticamente si hay una versión nueva al arrancar consultando `version.json`.

Para distribuir una nueva versión:
1. Compilar el APK nuevo
2. Subir a [GitHub Releases](https://github.com/Patisporelmundo/SabiCash/releases) como `vX.X.X`
3. Actualizar `version.json` con la nueva versión y URL

---

## Estructura del proyecto

```
SabiCash/
├── App.js                    # Navegación principal + check de actualizaciones
├── app.json                  # Configuración Expo
├── src/
│   ├── config.js             # API keys (NO subir con keys reales)
│   ├── context/
│   │   └── AppContext.js     # Estado global de la app
│   ├── data/
│   │   └── questions.js      # Banco de preguntas offline + definición de asignaturas
│   ├── screens/
│   │   ├── OnboardingScreen.js
│   │   ├── HomeScreen.js
│   │   ├── GamesScreen.js    # Juegos + Ronda Especial
│   │   ├── WalletScreen.js   # Gestión de paga y gastos
│   │   ├── HistoryScreen.js
│   │   └── ParentScreen.js   # Panel de padres con estadísticas
│   └── utils/
│       ├── gemini.js         # Integración con Groq
│       ├── logic.js          # Lógica de paga y puntos
│       └── styles.js         # Colores globales
└── version.json              # Control de versiones para actualizaciones OTA
```

---

## Seguridad

- `src/config.js` está en `.gitignore` — nunca subas las API keys al repositorio
- El PIN de padres se guarda localmente con AsyncStorage
- Sin servidor propio — todos los datos son locales en el dispositivo

---

## Licencia

Proyecto privado — © 2026 Patrimonio 360. Todos los derechos reservados.
