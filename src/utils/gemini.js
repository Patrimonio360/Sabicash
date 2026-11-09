import { GROQ_API_KEY, GROQ_URL, GROQ_MODEL } from '../config';
import { COURSES, SUBJECTS, SECOND_LANGUAGE_OPTIONS } from '../data/questions';

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function isValidOpts(opts) {
  if (!Array.isArray(opts) || opts.length !== 4) return false;
  const generic = /^(opci[oó]n\s*[abcd]|[abcd]\.?|opci[oó]n\s*\d)$/i;
  return opts.every(opt =>
    typeof opt === 'string' &&
    opt.trim().length > 1 &&
    !generic.test(opt.trim())
  );
}

// difficulty: 1 = nivel base del curso; sube con cada ronda superada de la asignatura.
function difficultyBlock(difficulty, courseLabel) {
  const lvl = Math.max(1, Math.round(difficulty));
  if (lvl <= 1) return '';
  return `\nNIVEL DE DIFICULTAD: ${lvl} (1 = más fácil, el alumno ya ha superado ${lvl - 1} ronda(s) de esta asignatura).
A mayor nivel, aumenta la exigencia: enunciados con más pasos de razonamiento, vocabulario más técnico, datos menos evidentes y distractores más sutiles y creíbles. NO te salgas del currículo de ${courseLabel}; sube la dificultad dentro de ese nivel, sin pasar a contenidos de cursos superiores.`;
}

export async function generateQuestion(courseId, subjectKey, usedQuestions = [], secondLanguage = 'frances', difficulty = 1) {
  const course = COURSES.find(c => c.id === courseId);
  if (!course) return null;

  let subjectLabel;
  if (subjectKey === 'segundo') {
    const lang = SECOND_LANGUAGE_OPTIONS.find(l => l.key === secondLanguage) || SECOND_LANGUAGE_OPTIONS[0];
    subjectLabel = lang.label;
  } else {
    const subject = SUBJECTS[subjectKey];
    if (!subject) return null;
    subjectLabel = subject.label;
  }

  const isDev = Math.random() > 0.5;
  const avoidBlock = usedQuestions.length > 0
    ? `\nNO repitas NINGUNA de estas preguntas ya hechas (ni variantes equivalentes):\n${usedQuestions.slice(-20).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';
  const diffBlock = difficultyBlock(difficulty, course.label);

  const promptTest = `Eres un profesor experto del sistema educativo español.
Genera 1 pregunta tipo test sobre ${subjectLabel} para ${course.label} (${course.age}) según el currículo LOMLOE.${diffBlock}${avoidBlock}

Responde ÚNICAMENTE con este JSON, sin markdown ni texto extra:
{"type":"test","q":"texto de la pregunta","correct":"respuesta correcta","wrong":["distractor 1","distractor 2","distractor 3"],"exp":"explicación de por qué es correcta"}

Ejemplo real:
{"type":"test","q":"¿Cuántos lados tiene un cuadrado?","correct":"4 lados","wrong":["3 lados","5 lados","6 lados"],"exp":"Un cuadrado tiene exactamente 4 lados iguales."}

REGLAS IMPORTANTES:
- "correct" debe ser la única respuesta verdadera a la pregunta.
- "wrong" debe contener exactamente 3 distractores incorrectos pero plausibles.
- La explicación debe confirmar por qué "correct" es la respuesta verdadera.
- Todas las opciones deben ser textos completos, nunca letras sueltas como "A" o "B".`;

  const promptDev = `Eres un profesor experto del sistema educativo español.
Genera 1 pregunta de desarrollo sobre ${subjectLabel} para ${course.label} (${course.age}) según el currículo LOMLOE.
La pregunta debe requerir que el alumno redacte o explique algo con sus palabras.${diffBlock}${avoidBlock}

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra:
{"type":"dev","q":"pregunta de desarrollo","answer":"respuesta modelo completa","exp":"explicación ampliada"}`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: isDev ? promptDev : promptTest }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return null;
    }

    if (parsed.type === 'test') {
      const { q, correct, wrong, exp } = parsed;
      if (
        typeof q !== 'string' || q.length < 5 ||
        typeof correct !== 'string' || correct.trim().length < 2 ||
        !Array.isArray(wrong) || wrong.length !== 3 ||
        typeof exp !== 'string' || exp.length < 5
      ) return null;

      const shuffled = shuffle([correct, ...wrong]);
      const a = shuffled.indexOf(correct);
      if (!isValidOpts(shuffled)) return null;

      return { type: 'test', q, opts: shuffled, a, exp };
    }

    if (parsed.type === 'dev') {
      const { q, answer, exp } = parsed;
      if (
        typeof q !== 'string' || q.length < 5 ||
        typeof answer !== 'string' || answer.length < 5 ||
        typeof exp !== 'string'
      ) return null;
      return { type: 'dev', q, answer, exp };
    }

    return null;

  } catch {
    return null;
  }
}