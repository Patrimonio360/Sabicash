
import { GROQ_API_KEY, GROQ_URL, GROQ_MODEL } from '../config';
import { COURSES, SUBJECTS, SECOND_LANGUAGE_OPTIONS } from '../data/questions';

// Mezcla un array aleatoriamente
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// Valida que las opciones son texto real (no letras sueltas ni placeholders)
function isValidOpts(opts) {
  if (!Array.isArray(opts) || opts.length !== 4) return false;
  const generic = /^(opci[oó]n\s*[abcd]|[abcd]\.?|opci[oó]n\s*\d)$/i;
  return opts.every(opt =>
    typeof opt === 'string' &&
    opt.trim().length > 1 &&
    !generic.test(opt.trim())
  );
}

export async function generateQuestion(courseId, subjectKey, usedQuestions = [], secondLanguage = 'frances') {
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
    ? `\nNO repitas estas preguntas ya hechas:\n${usedQuestions.slice(-8).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  // ── NUEVO FORMATO: correct + wrong[] en vez de opts[] + a ──
  // Así es IMPOSIBLE que el índice sea incorrecto — lo calculamos nosotros
  const promptTest = `Eres un profesor experto del sistema educativo español.
Genera 1 pregunta tipo test sobre ${subjectLabel} para ${course.label} (${course.age}) según el currículo LOMLOE.${avoidBlock}

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
La pregunta debe requerir que el alumno redacte o explique algo con sus palabras.${avoidBlock}

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

    // ── Preguntas tipo TEST ──
    if (parsed.type === 'test') {
      const { q, correct, wrong, exp } = parsed;

      // Validaciones básicas
      if (
        typeof q !== 'string' || q.length < 5 ||
        typeof correct !== 'string' || correct.trim().length < 2 ||
        !Array.isArray(wrong) || wrong.length !== 3 ||
        typeof exp !== 'string' || exp.length < 5
      ) return null;

      // Construir opts mezclando correct + wrong — a se calcula aquí, nunca por Groq
      const shuffled = shuffle([correct, ...wrong]);
      const a = shuffled.indexOf(correct);

      // Validar que las opciones son texto real
      if (!isValidOpts(shuffled)) return null;

      return { type: 'test', q, opts: shuffled, a, exp };
    }

    // ── Preguntas de DESARROLLO ──
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