# CLAUDE.md — SabiCash

> Contexto completo del proyecto para Claude Code. Leer antes de cualquier acción.

---

## ¿Qué es SabiCash?

App móvil de educación financiera infantil. Los niños responden preguntas del currículo
escolar español (LOMLOE) para ganar "paga virtual" que los padres gestionan desde un
panel protegido con PIN. Objetivo: enseñar a los niños el valor del dinero y del esfuerzo.

---

## Stack técnico

| Elemento | Tecnología |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navegación | React Navigation (Stack + BottomTabs) |
| IA preguntas | Groq API (llama-3.1-8b-instant) |
| Almacenamiento | AsyncStorage (local, sin backend) |
| Compilación | compilar.bat → Gradle → APK |
| Repo | github.com/Patrimonio360/Sabicash |

---

## Estructura del proyecto
sabicash/
├── App.js                  # Entrada principal, navegación, check de versión
├── app.json                # Config Expo (versión, bundle ID, permisos)
├── version.json            # Control OTA: { version, notes, url }
├── compilar.bat            # Script de compilación automática con versionado
├── CLAUDE.md               # Este archivo
├── src/
│   ├── config.js           # GROQ_API_KEY, GROQ_URL, GROQ_MODEL
│   ├── context/
│   │   └── AppContext.js   # Estado global: perfil, saldo, puntos, alertas
│   ├── data/
│   │   └── questions.js    # Banco offline de preguntas (COURSES, SUBJECTS, SECOND_LANGUAGE_OPTIONS)
│   ├── screens/
│   │   ├── OnboardingScreen.js   # Setup inicial: nombre, curso, PIN padres
│   │   ├── HomeScreen.js         # Dashboard: saldo, puntos, acceso a juegos
│   │   ├── GamesScreen.js        # Motor de preguntas tipo test y desarrollo
│   │   ├── WalletScreen.js       # Vista de paga y saldo acumulado
│   │   ├── HistoryScreen.js      # Historial de preguntas y resultados
│   │   └── ParentScreen.js       # Panel de padres con PIN
│   └── utils/
│       └── gemini.js       # Generador de preguntas con Groq (mal llamado gemini, es Groq)
└── android/                # Generado por expo prebuild, NO editar manualmente

---

## Flujo de preguntas (GamesScreen + gemini.js)

1. El usuario selecciona asignatura
2. Se llama a `generateQuestion(courseId, subjectKey, usedQuestions)`
3. Groq devuelve JSON con formato:
```json
   {
     "type": "test",
     "q": "texto de la pregunta",
     "correct": "respuesta correcta",
     "wrong": ["distractor1", "distractor2", "distractor3"],
     "exp": "explicación"
   }
```
4. El código mezcla `correct + wrong[]` con `shuffle()` y calcula el índice `a`
5. Si Groq falla o las opciones son inválidas → fallback al banco offline `questions.js`

> ⚠️ IMPORTANTE: Groq calcula el texto, el código calcula el índice. Nunca dejes que Groq devuelva el índice directamente.

---

## Sistema de versiones (OTA)

- `app.json` → campo `expo.version` = versión real del APK
- `version.json` → versión publicada que la app compara al arrancar
- `App.js` → lee versión con `Constants.expoConfig?.version` (expo-constants)
- Si `version.json > app.json` → muestra alerta de actualización con link de descarga
- `compilar.bat` → auto-incrementa patch en `app.json` y `version.json` y hace push

> Nunca hardcodear la versión en App.js. Siempre usar expo-constants.

---

## Comandos útiles

```bash
# Desarrollo con Expo Go (sin compilar)
npx expo start

# Compilar APK (usa compilar.bat desde Windows)
compilar.bat

# Reinstalar dependencias limpias
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Subir cambios
git add .
git commit -m "descripción"
git push
```

---

## Variables de entorno / Config

Archivo: `src/config.js`
```js
export const GROQ_API_KEY = 'gsk_...';
export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.1-8b-instant';
```

---

## Bugs resueltos

| Bug | Causa | Solución |
|---|---|---|
| Opciones mostraban "A/B/C/D" | Groq copiaba placeholders del prompt | Prompt usa ejemplos reales + validación `isValidOpts()` |
| Respuesta correcta incorrecta | Groq calculaba índice `a` erróneo | Nuevo formato `correct+wrong[]`, índice calculado en código |
| Aviso update falso siempre | `APP_VERSION` hardcodeada a versión anterior | `Constants.expoConfig?.version` lee `app.json` automáticamente |
| node_modules corrupto | Instalación parcial | `Remove-Item node_modules` + `npm install` |

---

## Pendientes

- [ ] Probar preguntas Groq en móvil tras fix de gemini.js v2
- [ ] Verificar que el aviso de actualización ya no aparece en falso
- [ ] Subir APK compilado a URL pública y actualizar `version.json.url`
- [ ] Panel de padres: revisar funcionalidades completas
- [ ] Publicar en Google Play (futuro)

---

## Notas importantes

- La carpeta `android/` la genera `expo prebuild`. Si hay problemas de compilación, bórrala y deja que el bat la regenere.
- El archivo `gemini.js` usa Groq, no Gemini. El nombre es incorrecto pero se mantiene por compatibilidad.
- No hay backend. Todo el estado vive en AsyncStorage del dispositivo.
- El proyecto es de la marca **Patrimonio 360** (Oscar, Sevilla).