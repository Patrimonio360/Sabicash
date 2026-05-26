import { GROQ_API_KEY, GROQ_URL, GROQ_MODEL } from '../config';
import { COURSES, SUBJECTS, SECOND_LANGUAGE_OPTIONS } from '../data/questions';

// Valida que las opciones son texto real y no placeholders genéricos
function isValidOpts(opts) {
  if (!Array.isArray(opts) || opts.length !== 4) return false;
  const genericPatterns = /^(opci[oó]n\s*[abcd]|[abcd]|opci[oó]n\s*\d|\d\s*[\.\)]?\s*$)/i;
  return opts.every(opt =>
    typeof opt === 'string' &&
    opt.trim().length > 1 &&
    !genericPatterns.test(opt.trim())
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

  // PROMPT TEST: ejemplo con contenido real para que Groq no copie los placeholders
  const promptTest = `Eres un profesor experto del sistema educativo español.
Genera 1 pregunta tipo test sobre ${subjectLabel} para ${course.label} (${course.age}) según el currículo LOMLOE.${avoidBlock}

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra. Ejemplo de formato correcto:
{"type":"test","q":"¿Cuántos lados tiene un triángulo?","opts":["2 lados","3 lados","4 lados","5 lados"],"a":1,"exp":"Un triángulo tiene exactamente 3 lados, que corresponde a la segunda opción."}

Reglas del campo "a" (índice de la respuesta correcta, empieza en 0):
- Si la opción correcta es la primera  → "a":0
- Si la opción correcta es la segunda  → "a":1
- Si la opción correcta es la tercera  → "a":2
- Si la opción correcta es la cuarta   → "a":3

IMPORTANTE:
- Las 4 opciones en "opts" deben ser textos completos y diferentes entre sí, nunca letras sueltas.
- La explicación debe confirmar cuál es la correcta y por qué.
- Asegúrate de que "a" apunta realmente a la opción correcta dentro de "opts".`;

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

    // Limpiar posibles bloques markdown que Groq añade a veces
    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return null;
    }

    if (parsed.type === 'test') {
      if (
        typeof parsed.q === 'string' && parsed.q.length > 5 &&
        isValidOpts(parsed.opts) &&
        typeof parsed.a === 'number' && parsed.a >= 0 && parsed.a <= 3 &&
        typeof parsed.exp === 'string' && parsed.exp.length > 5
      ) return parsed;
      return null; // Rechaza si las opciones son basura
    }

    if (parsed.type === 'dev') {
      if (
        typeof parsed.q === 'string' && parsed.q.length > 5 &&
        typeof parsed.answer === 'string' && parsed.answer.length > 5 &&
        typeof parsed.exp === 'string'
      ) return parsed;
    }

    return null;

  } catch {
    return null;
  }
}
