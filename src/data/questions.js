// ─────────────────────────────────────────────────────────────
// BANCO DE PREGUNTAS — SabiCash
// Alineado con currículo LOMLOE (España)
// Las preguntas son generadas por IA (Groq) — este banco es fallback offline
// ─────────────────────────────────────────────────────────────

export const COURSES = [
  { id: '1pri',  label: '1º Primaria', age: '6-7 años',   emoji: '🌱' },
  { id: '2pri',  label: '2º Primaria', age: '7-8 años',   emoji: '🌿' },
  { id: '3pri',  label: '3º Primaria', age: '8-9 años',   emoji: '🍀' },
  { id: '4pri',  label: '4º Primaria', age: '9-10 años',  emoji: '🌳' },
  { id: '5pri',  label: '5º Primaria', age: '10-11 años', emoji: '⭐' },
  { id: '6pri',  label: '6º Primaria', age: '11-12 años', emoji: '🌟' },
  { id: '1eso',  label: '1º ESO',      age: '12-13 años', emoji: '🔵' },
  { id: '2eso',  label: '2º ESO',      age: '13-14 años', emoji: '🟣' },
  { id: '3eso',  label: '3º ESO',      age: '14-15 años', emoji: '🟠' },
  { id: '4eso',  label: '4º ESO',      age: '15-16 años', emoji: '🔴' },
  { id: '1bach', label: '1º Bach',     age: '16-17 años', emoji: '🏆' },
  { id: '2bach', label: '2º Bach',     age: '17-18 años', emoji: '🎓' },
];

// ── Todas las asignaturas disponibles ──────────────────────────
export const SUBJECTS = {
  mates:      { label: 'Matemáticas',    emoji: '🔢', color: '#3b82f6' },
  lengua:     { label: 'Lengua',         emoji: '📝', color: '#8b5cf6' },
  ingles:     { label: 'Inglés',         emoji: '🇬🇧', color: '#ef4444' },
  ciencias:   { label: 'C. Naturales',   emoji: '🔬', color: '#10b981' },
  sociales:   { label: 'C. Sociales',    emoji: '🌍', color: '#f59e0b' },
  historia:   { label: 'Historia',       emoji: '🏛️', color: '#92400e' },
  geo:        { label: 'Geografía',      emoji: '🗺️', color: '#0891b2' },
  musica:     { label: 'Música',         emoji: '🎵', color: '#db2777' },
  arte:       { label: 'Ed. Artística',  emoji: '🎨', color: '#d97706' },
  tecnologia: { label: 'Tecnología',     emoji: '⚙️', color: '#475569' },
  etica:      { label: 'Valores Éticos', emoji: '⚖️', color: '#7c3aed' },
  filosofia:  { label: 'Filosofía',      emoji: '🧠', color: '#1d4ed8' },
  cultura:    { label: 'Cultura General',emoji: '🌐', color: '#059669' },
  // Segundo idioma — etiqueta se personaliza según elección del usuario
  segundo:    { label: 'Francés',        emoji: '🇫🇷', color: '#2563eb' },
};

// ── Etiquetas para el segundo idioma ──────────────────────────
export const SECOND_LANGUAGE_OPTIONS = [
  { key: 'frances',   label: 'Francés',    emoji: '🇫🇷', flag: '🇫🇷' },
  { key: 'aleman',    label: 'Alemán',     emoji: '🇩🇪', flag: '🇩🇪' },
  { key: 'italiano',  label: 'Italiano',   emoji: '🇮🇹', flag: '🇮🇹' },
  { key: 'portugues', label: 'Portugués',  emoji: '🇵🇹', flag: '🇵🇹' },
  { key: 'chino',     label: 'Chino',      emoji: '🇨🇳', flag: '🇨🇳' },
];

// ── Asignaturas disponibles por curso ─────────────────────────
export const SUBJECTS_BY_COURSE = {
  '1pri':  ['mates', 'lengua', 'ingles', 'ciencias', 'sociales', 'musica', 'arte'],
  '2pri':  ['mates', 'lengua', 'ingles', 'ciencias', 'sociales', 'musica', 'arte'],
  '3pri':  ['mates', 'lengua', 'ingles', 'ciencias', 'sociales', 'musica', 'arte', 'segundo'],
  '4pri':  ['mates', 'lengua', 'ingles', 'ciencias', 'sociales', 'musica', 'arte', 'segundo'],
  '5pri':  ['mates', 'lengua', 'ingles', 'ciencias', 'sociales', 'historia', 'musica', 'arte', 'segundo'],
  '6pri':  ['mates', 'lengua', 'ingles', 'ciencias', 'sociales', 'historia', 'musica', 'arte', 'segundo'],
  '1eso':  ['mates', 'lengua', 'ingles', 'ciencias', 'geo', 'historia', 'musica', 'tecnologia', 'etica', 'segundo'],
  '2eso':  ['mates', 'lengua', 'ingles', 'ciencias', 'geo', 'historia', 'musica', 'tecnologia', 'etica', 'segundo'],
  '3eso':  ['mates', 'lengua', 'ingles', 'ciencias', 'geo', 'historia', 'musica', 'tecnologia', 'etica', 'segundo'],
  '4eso':  ['mates', 'lengua', 'ingles', 'ciencias', 'geo', 'historia', 'filosofia', 'cultura', 'etica', 'segundo'],
  '1bach': ['mates', 'lengua', 'ingles', 'ciencias', 'historia', 'filosofia', 'cultura', 'segundo'],
  '2bach': ['mates', 'lengua', 'ingles', 'historia', 'filosofia', 'cultura', 'segundo'],
};

export const POINTS_PER_QUESTION  = 10;
export const POINTS_PER_EURO_CENT = 50;

// ── Banco de preguntas offline (fallback) ──────────────────────
// Solo contiene preguntas básicas de las asignaturas principales.
// Groq genera preguntas dinámicas para todas las asignaturas.
export const QUESTIONS = {
  '1pri': {
    mates:    [
      { q: '¿Cuánto es 3 + 4?', opts: ['5','6','7','8'], a: 2, exp: '3 + 4 = 7.' },
      { q: '¿Cuánto es 9 - 3?', opts: ['4','5','6','7'], a: 2, exp: '9 - 3 = 6.' },
      { q: '¿Cuántos lados tiene un triángulo?', opts: ['2','3','4','5'], a: 1, exp: 'El triángulo tiene 3 lados.' },
      { q: '¿Cuánto es 5 + 5?', opts: ['8','9','10','11'], a: 2, exp: '5 + 5 = 10.' },
      { q: '¿Qué número va después del 7?', opts: ['6','8','9','10'], a: 1, exp: 'Después del 7 va el 8.' },
    ],
    lengua:   [
      { q: '¿Cuántas vocales tiene el español?', opts: ['3','4','5','6'], a: 2, exp: 'Las vocales son: a, e, i, o, u.' },
      { q: '¿Cuál empieza por vocal?', opts: ['pato','mesa','árbol','coche'], a: 2, exp: 'Árbol empieza por "a".' },
      { q: '¿Plural de "gato"?', opts: ['gato','gatos','gatoz','gatoes'], a: 1, exp: 'gato → gatos.' },
      { q: '¿Qué signo va al final de una pregunta?', opts: ['punto','coma','exclamación','interrogación'], a: 3, exp: 'Las preguntas terminan con ?.' },
      { q: '¿Cuál es mayúscula?', opts: ['a','m','R','t'], a: 2, exp: 'La R es mayúscula.' },
    ],
    ingles:   [
      { q: 'What color is the sky?', opts: ['Red','Green','Blue','Yellow'], a: 2, exp: 'The sky is blue.' },
      { q: 'How do you say "hola"?', opts: ['Bye','Hello','Please','Thanks'], a: 1, exp: '"Hello" means "hola".' },
      { q: 'How many days in a week?', opts: ['5','6','7','8'], a: 2, exp: '7 days: Mon, Tue, Wed, Thu, Fri, Sat, Sun.' },
      { q: 'What number is "three"?', opts: ['1','2','3','4'], a: 2, exp: 'Three = 3.' },
      { q: 'What animal says "moo"?', opts: ['Dog','Cat','Cow','Bird'], a: 2, exp: 'A cow says "moo".' },
    ],
    ciencias: [
      { q: '¿Cuántas patas tiene un perro?', opts: ['2','3','4','6'], a: 2, exp: 'Los perros tienen 4 patas.' },
      { q: '¿De dónde viene la luz del día?', opts: ['Luna','Sol','Estrellas','Nubes'], a: 1, exp: 'La luz viene del Sol.' },
      { q: '¿Qué necesitan las plantas?', opts: ['Solo agua','Agua, luz y tierra','Solo luz','Solo tierra'], a: 1, exp: 'Agua, luz y minerales del suelo.' },
      { q: '¿Qué usamos para oír?', opts: ['Ojos','Nariz','Oídos','Boca'], a: 2, exp: 'Los oídos nos sirven para escuchar.' },
      { q: '¿Cuál es un animal?', opts: ['Rosa','Piedra','Mariposa','Nube'], a: 2, exp: 'La mariposa es un insecto.' },
    ],
    sociales: [
      { q: '¿Cuántas estaciones tiene el año?', opts: ['2','3','4','5'], a: 2, exp: 'Primavera, verano, otoño e invierno.' },
      { q: '¿En qué país vivimos?', opts: ['Francia','Portugal','España','Italia'], a: 2, exp: 'Vivimos en España.' },
      { q: '¿Cuál es la estación más calurosa?', opts: ['Primavera','Verano','Otoño','Invierno'], a: 1, exp: 'El verano es la estación más calurosa.' },
      { q: '¿Cuál es un medio de transporte?', opts: ['Silla','Autobús','Mesa','Ventana'], a: 1, exp: 'El autobús es un transporte público.' },
      { q: '¿Qué es la familia?', opts: ['Amigos','Personas que nos cuidan y quieren','Compañeros','Vecinos'], a: 1, exp: 'La familia nos cuida y quiere.' },
    ],
    musica:   [
      { q: '¿Cuántas notas musicales hay?', opts: ['5','6','7','8'], a: 2, exp: 'Do, Re, Mi, Fa, Sol, La, Si — 7 notas.' },
      { q: '¿Cuál es la primera nota musical?', opts: ['Re','Mi','Do','Fa'], a: 2, exp: 'La primera nota es Do.' },
      { q: '¿Qué instrumento se toca con los dedos en las cuerdas?', opts: ['Flauta','Guitarra','Tambor','Trompeta'], a: 1, exp: 'La guitarra tiene cuerdas que se puntean.' },
      { q: '¿Cómo se llama el instrumento de viento escolar?', opts: ['Violín','Piano','Flauta','Guitarra'], a: 2, exp: 'La flauta dulce es el instrumento escolar más común.' },
      { q: '¿Qué es un ritmo?', opts: ['Una nota muy alta','La repetición de sonidos en el tiempo','Un instrumento','Una canción'], a: 1, exp: 'El ritmo es la repetición ordenada de sonidos.' },
    ],
    arte:     [
      { q: '¿Cuáles son los colores primarios?', opts: ['Verde, naranja, morado','Rojo, azul y amarillo','Negro, blanco y gris','Rosa, celeste y beige'], a: 1, exp: 'Los colores primarios son rojo, azul y amarillo.' },
      { q: '¿Qué se usa para pintar acuarelas?', opts: ['Óleo','Agua y pintura','Arcilla','Ceras'], a: 1, exp: 'Las acuarelas se diluyen con agua.' },
      { q: '¿Qué forma tiene un círculo?', opts: ['Cuadrada','Triangular','Redonda','Rectangular'], a: 2, exp: 'El círculo tiene forma redonda perfecta.' },
      { q: '¿Qué herramienta usamos para dibujar líneas rectas?', opts: ['Compás','Regla','Tijeras','Borrador'], a: 1, exp: 'La regla nos ayuda a trazar líneas rectas.' },
      { q: 'Rojo + Azul = ?', opts: ['Verde','Naranja','Morado','Marrón'], a: 2, exp: 'Rojo + Azul = Morado (color secundario).' },
    ],
  },

  // Para el resto de cursos dejamos arrays vacíos — Groq genera las preguntas
  '2pri':  { mates: [], lengua: [], ingles: [], ciencias: [], sociales: [], musica: [], arte: [], segundo: [] },
  '3pri':  { mates: [], lengua: [], ingles: [], ciencias: [], sociales: [], musica: [], arte: [], segundo: [], historia: [] },
  '4pri':  { mates: [], lengua: [], ingles: [], ciencias: [], sociales: [], musica: [], arte: [], segundo: [], historia: [] },
  '5pri':  { mates: [], lengua: [], ingles: [], ciencias: [], sociales: [], musica: [], arte: [], segundo: [], historia: [] },
  '6pri':  { mates: [], lengua: [], ingles: [], ciencias: [], sociales: [], musica: [], arte: [], segundo: [], historia: [] },
  '1eso':  { mates: [], lengua: [], ingles: [], ciencias: [], geo: [], historia: [], musica: [], tecnologia: [], etica: [], segundo: [] },
  '2eso':  { mates: [], lengua: [], ingles: [], ciencias: [], geo: [], historia: [], musica: [], tecnologia: [], etica: [], segundo: [] },
  '3eso':  { mates: [], lengua: [], ingles: [], ciencias: [], geo: [], historia: [], musica: [], tecnologia: [], etica: [], segundo: [] },
  '4eso':  { mates: [], lengua: [], ingles: [], ciencias: [], geo: [], historia: [], filosofia: [], cultura: [], etica: [], segundo: [] },
  '1bach': { mates: [], lengua: [], ingles: [], ciencias: [], historia: [], filosofia: [], cultura: [], segundo: [] },
  '2bach': { mates: [], lengua: [], ingles: [], historia: [], filosofia: [], cultura: [], segundo: [] },
};
