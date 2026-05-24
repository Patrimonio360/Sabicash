import { GROQ_API_KEY, GROQ_URL, GROQ_MODEL } from '../config';
import { COURSES, SUBJECTS, SECOND_LANGUAGE_OPTIONS } from '../data/questions';

export async function generateQuestion(courseId, subjectKey, usedQuestions = [], secondLanguage = 'frances') {
  const course  = COURSES.find(c => c.id === courseId);
  if (!course) return null;

  // Resolver etiqueta del segundo idioma
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

  const promptTest = `Eres un profesor experto del sistema educativo español.
Genera 1 pregunta tipo test sobre ${subjectLabel} para ${course.label} (${course.age}) según el currículo LOMLOE.${avoidBlock}

Responde ÚNICAMENTE con este JSON, sin markdown ni texto extra:
{"type":"test","q":"pregunta","opts":["opción A","opción B","opción C","opción D"],"a":0,"exp":"explicación"}

El campo "a" indica qué opción es correcta:
- Si la correcta es "opción A" → "a":0
- Si la correcta es "opción B" → "a":1
- Si la correcta es "opción C" → "a":2
- Si la correcta es "opción D" → "a":3

La explicación DEBE empezar con la respuesta correcta. Ejemplo: si a=1, exp debe empezar con "opción B es correcta porque..."`;
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
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw  = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const clean  = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (parsed.type === 'test') {
      if (
        typeof parsed.q === 'string' &&
        Array.isArray(parsed.opts) && parsed.opts.length === 4 &&
        typeof parsed.a === 'number' && parsed.a >= 0 && parsed.a <= 3 &&
        typeof parsed.exp === 'string'
      ) return parsed;
    }

    if (parsed.type === 'dev') {
      if (
        typeof parsed.q      === 'string' &&
        typeof parsed.answer === 'string' &&
        typeof parsed.exp    === 'string'
      ) return parsed;
    }

    return null;
  } catch {
    return null;
  }
}
