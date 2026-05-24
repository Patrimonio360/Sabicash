import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { QUESTIONS, SUBJECTS, SUBJECTS_BY_COURSE, POINTS_PER_QUESTION, SECOND_LANGUAGE_OPTIONS } from '../data/questions';
import { POINTS_TO_CENTS, todayStr } from '../utils/logic';
import { generateQuestion } from '../utils/gemini';
import { C } from '../utils/styles';

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

const QUESTIONS_PER_SESSION = 5;
const MIN_PASS_RATIO        = 0.75;
const SPECIAL_BONUS         = 0.50;  // euros si pasa ronda especial
const SPECIAL_PENALTY       = 0.30;  // euros si falla ronda especial

// Obtener info de asignatura (resuelve "segundo" según idioma elegido)
function getSubjectInfo(subjectKey, secondLanguage) {
  if (subjectKey === 'segundo') {
    const lang = SECOND_LANGUAGE_OPTIONS.find(l => l.key === secondLanguage) || SECOND_LANGUAGE_OPTIONS[0];
    return { label: lang.label, emoji: lang.emoji, color: '#2563eb' };
  }
  return SUBJECTS[subjectKey] || { label: subjectKey, emoji: '📚', color: '#64748b' };
}

// Obtener asignaturas del curso del alumno
function getCourseSubjects(courseId) {
  return SUBJECTS_BY_COURSE[courseId] || Object.keys(SUBJECTS);
}

// Comprobar si ya se jugó hoy esta asignatura
function playedToday(dailyPlays, subjectKey) {
  const today = todayStr();
  if (!dailyPlays || dailyPlays.date !== today) return false;
  return dailyPlays.played.includes(subjectKey);
}

// ── Selector de asignatura ──────────────────────────────────
function SubjectSelector({ onSelect, courseId, dailyPlays, secondLanguage }) {
  const subjects    = getCourseSubjects(courseId);
  const today       = todayStr();
  const playsToday  = dailyPlays?.date === today ? dailyPlays.played : [];
  const remaining   = subjects.length - playsToday.length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎮 Elige asignatura</Text>
        <Text style={styles.sub}>
          {remaining > 0
            ? `${remaining} ronda${remaining !== 1 ? 's' : ''} disponible${remaining !== 1 ? 's' : ''} hoy · ${POINTS_PER_QUESTION} pts por acierto`
            : '✅ ¡Has completado todas las rondas de hoy! Vuelve mañana.'}
        </Text>

        {subjects.map(key => {
          const sub     = getSubjectInfo(key, secondLanguage);
          const played  = playsToday.includes(key);
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.subjectRow,
                { borderLeftColor: sub.color, borderLeftWidth: 4 },
                played && { opacity: 0.45 },
              ]}
              onPress={() => {
                if (played) {
                  Alert.alert('Ya jugaste hoy', `Ya completaste la ronda de ${sub.label} hoy. Vuelve mañana.`);
                  return;
                }
                onSelect(key);
              }}
            >
              <Text style={styles.subjectEmoji}>{sub.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.subjectName}>{sub.label}</Text>
                <Text style={styles.subjectCount}>
                  {played ? '✅ Completada hoy' : 'Test + desarrollo · IA + banco local'}
                </Text>
              </View>
              {played
                ? <Text style={{ color: '#22c55e', fontWeight: '900', fontSize: 18 }}>✓</Text>
                : <Text style={{ color: sub.color, fontWeight: '900', fontSize: 18 }}>›</Text>
              }
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ronda Especial */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#1e1040', borderWidth: 2, borderColor: '#7c3aed', padding: 18 }]}
        onPress={() => onSelect('especial')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 32 }}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '900', fontSize: 17, color: '#fff', marginBottom: 4 }}>Ronda Especial</Text>
            <Text style={{ fontSize: 12, color: '#a78bfa', lineHeight: 18 }}>
              {'Preguntas de todas las asignaturas\n✅ Superas 75% → +0,50 € bonus\n⛔ No superas → −0,30 € penalización'}
            </Text>
          </View>
          <Text style={{ color: '#7c3aed', fontWeight: '900', fontSize: 22 }}>›</Text>
        </View>
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#bfdbfe' }]}>
        <Text style={{ fontSize: 12, color: '#1e40af', lineHeight: 20 }}>
          {'📝 Desarrollo: escribe tu respuesta y comprueba si acertaste.\n🔢 Test: elige la opción correcta.\n⭐ Necesitas el 75% para ganar puntos.\n📅 Una ronda por asignatura al día.'}
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Pregunta tipo TEST ──────────────────────────────────────
function TestQuestion({ q, onAnswer }) {
  const [selected, setSelected] = useState(null);

  function pick(i) {
    if (selected !== null) return;
    setSelected(i);
    onAnswer(i === q.a);
  }

  return (
    <>
      <View style={styles.qCard}>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>🔢 Tipo test</Text>
        </View>
        <Text style={styles.qText}>{q.q}</Text>
      </View>
      {q.opts.map((opt, i) => {
        let bg = '#1e293b', border = '#334155', color = '#e2e8f0';
        if (selected !== null) {
          if (i === q.a)                        { bg = C.greenBg; border = C.green; color = '#065f46'; }
          else if (i === selected && i !== q.a) { bg = C.redBg;   border = C.red;  color = '#991b1b'; }
        }
        return (
          <TouchableOpacity key={i} style={[styles.optBtn, { backgroundColor: bg, borderColor: border }]} onPress={() => pick(i)} disabled={selected !== null}>
            <Text style={[styles.optLetter, { color: selected !== null && i === q.a ? C.green : '#64748b' }]}>{['A','B','C','D'][i]}</Text>
            <Text style={[styles.optText, { color }]}>{opt}</Text>
            {selected !== null && i === q.a             && <Text style={{ color: C.green, fontSize: 20 }}>✓</Text>}
            {selected !== null && i === selected && i !== q.a && <Text style={{ color: C.red,   fontSize: 20 }}>✗</Text>}
          </TouchableOpacity>
        );
      })}
      {selected !== null && (
        <View style={[styles.expBox, { borderColor: selected === q.a ? C.green : C.red, backgroundColor: selected === q.a ? C.greenBg : C.redBg }]}>
          <Text style={[styles.expText, { color: selected === q.a ? '#065f46' : '#991b1b' }]}>
            {selected === q.a ? '✅ ¡Correcto! ' : `❌ La respuesta era: "${q.opts[q.a]}". `}{q.exp}
          </Text>
        </View>
      )}
    </>
  );
}

// ── Pregunta de DESARROLLO ──────────────────────────────────
function DevQuestion({ q, onScore }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [revealed,   setRevealed]   = useState(false);
  const [scored,     setScored]     = useState(false);

  function reveal() {
    if (!userAnswer.trim()) { Alert.alert('Escribe algo', 'Intenta responder antes de ver la solución.'); return; }
    setRevealed(true);
  }

  function score(knew) {
    if (scored) return;
    setScored(true);
    onScore(knew);
  }

  return (
    <>
      <View style={styles.qCard}>
        <View style={[styles.badge, { backgroundColor: '#7c3aed22' }]}>
          <Text style={[styles.badgeTxt, { color: '#a78bfa' }]}>📝 Desarrollo</Text>
        </View>
        <Text style={styles.qText}>{q.q}</Text>
      </View>
      {!revealed ? (
        <>
          <TextInput
            style={styles.devInput} multiline numberOfLines={5}
            placeholder="Escribe tu respuesta aquí..."
            placeholderTextColor="#475569" value={userAnswer}
            onChangeText={setUserAnswer} textAlignVertical="top"
          />
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: '#7c3aed' }]} onPress={reveal}>
            <Text style={styles.nextBtnTxt}>Ver respuesta correcta →</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.userAnswerBox}>
            <Text style={styles.userAnswerLabel}>Tu respuesta:</Text>
            <Text style={styles.userAnswerText}>{userAnswer}</Text>
          </View>
          <View style={[styles.expBox, { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' }]}>
            <Text style={[styles.expText, { color: '#4c1d95', fontWeight: '800', marginBottom: 6 }]}>✏️ Respuesta modelo:</Text>
            <Text style={[styles.expText, { color: '#4c1d95' }]}>{q.answer}</Text>
            {q.exp && q.exp !== q.answer && (
              <>
                <View style={{ height: 1, backgroundColor: '#c4b5fd', marginVertical: 8 }} />
                <Text style={[styles.expText, { color: '#6d28d9' }]}>💡 {q.exp}</Text>
              </>
            )}
          </View>
          {!scored && (
            <>
              <Text style={styles.selfEvalLabel}>¿Lo sabías?</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.selfBtn, { backgroundColor: C.greenBg, borderColor: C.green }]} onPress={() => score(true)}>
                  <Text style={{ fontSize: 22 }}>✅</Text>
                  <Text style={[styles.selfBtnTxt, { color: C.green }]}>Sí, lo sabía</Text>
                  <Text style={{ fontSize: 11, color: C.green }}>+{POINTS_PER_QUESTION} pts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.selfBtn, { backgroundColor: C.redBg, borderColor: C.red }]} onPress={() => score(false)}>
                  <Text style={{ fontSize: 22 }}>❌</Text>
                  <Text style={[styles.selfBtnTxt, { color: C.red }]}>No lo sabía</Text>
                  <Text style={{ fontSize: 11, color: C.red }}>+0 pts</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {scored && (
            <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Respuesta registrada · pulsa Siguiente</Text>
            </View>
          )}
        </>
      )}
    </>
  );
}

// ── Quiz principal ──────────────────────────────────────────
function Quiz({ course, subject, secondLanguage, onFinish, isSpecialRound }) {
  const sub = getSubjectInfo(subject, secondLanguage);

  const usedQRef          = useRef([]);
  const fallbackRef       = useRef(shuffle(QUESTIONS[course]?.[subject] ?? []));
  const scoreRef          = useRef(0);
  const sessionCountRef   = useRef(0);
  const accumulatedPtsRef = useRef(0);

  const [currentQ,     setCurrentQ]    = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [loadError,    setLoadError]   = useState(false);
  const [answered,     setAnswered]    = useState(false);
  const [score,        setScore]       = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [showResult,   setShowResult]  = useState(false);
  const [questionKey,  setQuestionKey] = useState(0);

  useEffect(() => { loadNextQuestion(); }, []);

  const loadNextQuestion = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setAnswered(false);

    // Ronda especial: elegir asignatura aleatoria del curso
    const effectiveSubject = isSpecialRound
      ? (() => {
          const courseSubjects = getCourseSubjects(course).filter(s => s !== 'especial');
          return courseSubjects[Math.floor(Math.random() * courseSubjects.length)];
        })()
      : subject;

    const q = await generateQuestion(course, effectiveSubject, usedQRef.current, secondLanguage);

    if (q) {
      usedQRef.current = [...usedQRef.current, q.q];
      setCurrentQ(q);
    } else {
      let available = fallbackRef.current.filter(fq => !usedQRef.current.includes(fq.q));
      if (available.length === 0) {
        fallbackRef.current = shuffle(QUESTIONS[course]?.[subject] ?? []);
        usedQRef.current    = [];
        available           = fallbackRef.current;
      }
      if (available.length > 0) {
        const fb = { ...available[0], type: 'test' };
        usedQRef.current = [...usedQRef.current, fb.q];
        setCurrentQ(fb);
        setLoadError(true);
      } else {
        setCurrentQ(null);
        setLoadError(true);
      }
    }

    setLoading(false);
    setQuestionKey(k => k + 1);
  }, [course, subject, secondLanguage]);

  function handleAnswer(correct) {
    if (correct) { scoreRef.current += 1; setScore(scoreRef.current); }
    setAnswered(true);
  }

  function next() {
    sessionCountRef.current += 1;
    setSessionCount(sessionCountRef.current);
    if (sessionCountRef.current >= QUESTIONS_PER_SESSION) { setShowResult(true); return; }
    loadNextQuestion();
  }

  function restart() {
    const passed = scoreRef.current / QUESTIONS_PER_SESSION >= MIN_PASS_RATIO;
    if (passed) accumulatedPtsRef.current += scoreRef.current * POINTS_PER_QUESTION;
    usedQRef.current        = [];
    scoreRef.current        = 0;
    sessionCountRef.current = 0;
    setScore(0);
    setSessionCount(0);
    setShowResult(false);
    loadNextQuestion();
  }

  if (showResult) {
    const passed     = scoreRef.current / QUESTIONS_PER_SESSION >= MIN_PASS_RATIO;
    const roundPts   = passed ? scoreRef.current * POINTS_PER_QUESTION : 0;
    const totalPts   = accumulatedPtsRef.current + roundPts;
    const minCorrect = Math.ceil(QUESTIONS_PER_SESSION * MIN_PASS_RATIO);

    return (
      <View style={styles.resultContainer}>
        {isSpecialRound && (
          <Text style={{ fontSize: 14, color: '#a78bfa', fontWeight: '800', marginBottom: 8, letterSpacing: 1 }}>🎯 RONDA ESPECIAL</Text>
        )}
        <Text style={styles.resultEmoji}>
          {scoreRef.current === QUESTIONS_PER_SESSION ? '🏆' : passed ? '⭐' : '💪'}
        </Text>
        <Text style={styles.resultTitle}>
          {scoreRef.current === QUESTIONS_PER_SESSION ? '¡Perfecto!' : passed ? '¡Bien hecho!' : '¡Sigue practicando!'}
        </Text>
        <Text style={styles.resultScore}>{scoreRef.current} / {QUESTIONS_PER_SESSION} correctas</Text>

        {isSpecialRound ? (
          passed ? (
            <View style={[styles.resultPts, { backgroundColor: '#7c3aed' }]}>
              <Text style={styles.resultPtsText}>🎯 +0,50 € bonus especial</Text>
            </View>
          ) : (
            <>
              <View style={[styles.resultPts, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.resultPtsText}>⛔ −0,30 € penalización</Text>
              </View>
              <Text style={styles.resultSub}>
                {`Necesitas ${minCorrect} correctas para ganar el bonus. Conseguiste ${scoreRef.current}.`}
              </Text>
            </>
          )
        ) : passed ? (
          <>
            <View style={styles.resultPts}>
              <Text style={styles.resultPtsText}>+{roundPts} pts esta ronda</Text>
            </View>
            {accumulatedPtsRef.current > 0 && (
              <View style={[styles.resultPts, { backgroundColor: '#f59e0b', marginTop: 6 }]}>
                <Text style={styles.resultPtsText}>🔥 {totalPts} pts en total</Text>
              </View>
            )}
            <Text style={styles.resultSub}>
              {Math.floor(totalPts / POINTS_TO_CENTS) > 0
                ? `+${(Math.floor(totalPts / POINTS_TO_CENTS) * 0.10).toFixed(2).replace('.', ',')} € se añadirán a tu saldo`
                : `Necesitas ${POINTS_TO_CENTS - totalPts} pts más para ganar 0,10 €`}
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.resultPts, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.resultPtsText}>0 pts — no alcanzaste el 75%</Text>
            </View>
            <Text style={styles.resultSub}>
              {`Necesitas al menos ${minCorrect} respuestas correctas de ${QUESTIONS_PER_SESSION} para ganar puntos. Has conseguido ${scoreRef.current}. ¡Inténtalo de nuevo!`}
            </Text>
          </>
        )}

        <TouchableOpacity style={[styles.resultBtn, isSpecialRound && passed ? { backgroundColor: '#7c3aed' } : {}]}
          onPress={() => onFinish(totalPts, isSpecialRound, passed)}>
          <Text style={styles.resultBtnTxt}>← {passed ? 'Cobrar y volver' : 'Volver'}</Text>
        </TouchableOpacity>
        {!passed && (
          <TouchableOpacity style={[styles.resultBtn, { backgroundColor: sub.color, marginTop: 8 }]} onPress={restart}>
            <Text style={styles.resultBtnTxt}>🔄 Repetir ronda</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={sub.color} />
        <Text style={styles.loadingText}>Generando pregunta...</Text>
        <Text style={styles.loadingSubText}>{sub.emoji} {sub.label}</Text>
      </View>
    );
  }

  if (!currentQ) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📶</Text>
        <Text style={styles.loadingText}>Sin conexión</Text>
        <Text style={[styles.loadingSubText, { marginBottom: 20 }]}>Conéctate a internet para continuar.</Text>
        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: sub.color }]} onPress={loadNextQuestion}>
          <Text style={styles.nextBtnTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loadError && (
          <View style={{ backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fde047' }}>
            <Text style={{ fontSize: 11, color: '#92400e' }}>📶 Sin internet — usando banco local</Text>
          </View>
        )}
        <View style={styles.progressRow}>
          <Text style={styles.progressTxt}>{sub.emoji} {sub.label}</Text>
          <Text style={styles.progressTxt}>{sessionCount + 1} / {QUESTIONS_PER_SESSION}</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${((sessionCount + 1) / QUESTIONS_PER_SESSION) * 100}%`, backgroundColor: sub.color }]} />
        </View>

        {currentQ.type === 'test'
          ? <TestQuestion key={`test-${questionKey}`} q={currentQ} onAnswer={handleAnswer} />
          : <DevQuestion  key={`dev-${questionKey}`}  q={currentQ} onScore={handleAnswer} />
        }

        {answered && (
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: sub.color, marginTop: 16 }]} onPress={next}>
            <Text style={styles.nextBtnTxt}>
              {sessionCount + 1 < QUESTIONS_PER_SESSION ? 'Siguiente pregunta →' : 'Ver resultado 🏁'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Screen principal ─────────────────────────────────────────
export default function GamesScreen({ navigation }) {
  const { state, update } = useApp();
  const [subject, setSubject] = useState(null);

  function handleBack() {
    if (subject) {
      Alert.alert(
        'Salir del quiz',
        'Si sales ahora perderás el progreso de esta ronda. ¿Quieres cambiar de asignatura?',
        [
          { text: 'Continuar jugando', style: 'cancel' },
          { text: 'Cambiar asignatura', style: 'destructive', onPress: () => setSubject(null) },
        ]
      );
    } else {
      navigation.goBack();
    }
  }

  function handleFinish(pts, isSpecial = false, passed = false) {
    const today    = todayStr();
    const sub      = getSubjectInfo(subject, state.secondLanguage);

    // Marcar asignatura como jugada hoy
    const prevPlays = state.dailyPlays?.date === today ? state.dailyPlays.played : [];
    const newPlays  = prevPlays.includes(subject) ? prevPlays : [...prevPlays, subject];
    const newDailyPlays = { date: today, played: newPlays };

    // Ronda especial — bonus o penalización directa
    if (isSpecial) {
      if (passed) {
        const newBalance = state.balance + SPECIAL_BONUS;
        update({ balance: newBalance, dailyPlays: newDailyPlays });
        Alert.alert('🎯 ¡Ronda Especial superada!', `+${SPECIAL_BONUS.toFixed(2).replace('.', ',')} € añadidos a tu saldo. ¡Increíble!`);
      } else {
        const newBalance = Math.max(0, state.balance - SPECIAL_PENALTY);
        update({ balance: newBalance, dailyPlays: newDailyPlays });
        Alert.alert('⛔ Ronda Especial fallada', `−${SPECIAL_PENALTY.toFixed(2).replace('.', ',')} € deducidos de tu saldo. ¡La próxima vez lo consigues!`);
      }
      setSubject(null);
      return;
    }

    if (pts === 0) {
      update({ dailyPlays: newDailyPlays });
      setSubject(null);
      return;
    }

    const newAvailable = state.availablePoints + pts;
    const newTotal     = state.totalPoints + pts;
    const conversions  = Math.floor(newAvailable / POINTS_TO_CENTS);
    const earned       = conversions * 0.10;
    const remaining    = newAvailable % POINTS_TO_CENTS;
    const yesterday    = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yd           = yesterday.toISOString().slice(0, 10);
    const newStreak    = state.lastPlayDate === today ? state.streak : state.lastPlayDate === yd ? state.streak + 1 : 1;
    const newHistory   = [{ id: Date.now(), type: 'puntos', subject, points: pts, euros: earned, date: new Date().toLocaleDateString('es-ES') }, ...state.gameHistory];

    // Actualizar estadisticas por asignatura
    const prevStats  = state.subjectStats || {};
    const subStats   = prevStats[subject] || { correct: 0, wrong: 0, rounds: 0 };
    const correct    = Math.round((pts / POINTS_PER_QUESTION));
    const wrong      = QUESTIONS_PER_SESSION - correct;
    const newSubjectStats = {
      ...prevStats,
      [subject]: {
        correct:  subStats.correct + correct,
        wrong:    subStats.wrong   + wrong,
        rounds:   subStats.rounds  + 1,
      },
    };

    update({
      totalPoints: newTotal, availablePoints: remaining,
      balance: state.balance + earned, gameHistory: newHistory,
      lastPlayDate: today, streak: newStreak,
      dailyPlays: newDailyPlays,
      subjectStats: newSubjectStats,
    });

    if (earned > 0) Alert.alert('🎉 ¡Dinero ganado!', `Has convertido ${pts} puntos en ${earned.toFixed(2).replace('.', ',')} €. ¡Bien hecho!`);
    setSubject(null);
  }

  const subInfo = subject ? getSubjectInfo(subject, state.secondLanguage) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: subject ? '#0f172a' : C.bg }}>
      <StatusBar backgroundColor="#0f172a" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backTxt}>← {subject ? 'Cambiar asignatura' : 'Inicio'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {subInfo ? `${subInfo.emoji} ${subInfo.label}` : '🎮 Juegos'}
        </Text>
        <Text style={styles.headerPts}>⭐ {state.totalPoints} pts</Text>
      </View>
      {subject
        ? <Quiz
            course={state.course}
            subject={subject}
            secondLanguage={state.secondLanguage || 'frances'}
            onFinish={handleFinish}
            isSpecialRound={subject === 'especial'}
          />
        : <SubjectSelector
            courseId={state.course}
            dailyPlays={state.dailyPlays}
            secondLanguage={state.secondLanguage || 'frances'}
            onSelect={setSubject}
          />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:          { backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 8 },
  backBtn:         { padding: 4 },
  backTxt:         { color: '#60a5fa', fontWeight: '700', fontSize: 13 },
  headerTitle:     { color: '#fff', fontWeight: '900', fontSize: 16 },
  headerPts:       { color: '#fbbf24', fontWeight: '800', fontSize: 14 },
  card:            { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, elevation: 2 },
  cardTitle:       { fontWeight: '800', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sub:             { fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 18 },
  subjectRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 8, gap: 12 },
  subjectEmoji:    { fontSize: 28 },
  subjectName:     { fontWeight: '800', fontSize: 15, color: '#0f172a' },
  subjectCount:    { fontSize: 12, color: '#64748b', marginTop: 2 },
  loadingContainer:{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText:     { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  loadingSubText:  { color: '#64748b', fontSize: 13, textAlign: 'center' },
  progressRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTxt:     { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  progressBg:      { backgroundColor: '#1e293b', borderRadius: 99, height: 6, overflow: 'hidden', marginBottom: 20 },
  progressFill:    { height: '100%', borderRadius: 99 },
  qCard:           { backgroundColor: '#1e293b', borderRadius: 18, padding: 20, marginBottom: 16 },
  badge:           { backgroundColor: '#3b82f622', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  badgeTxt:        { fontSize: 11, fontWeight: '800', color: '#60a5fa' },
  qText:           { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 26 },
  optBtn:          { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 2, gap: 12 },
  optLetter:       { fontWeight: '900', fontSize: 16, width: 24 },
  optText:         { flex: 1, fontWeight: '700', fontSize: 15 },
  expBox:          { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1.5 },
  expText:         { fontSize: 13, lineHeight: 20, fontWeight: '600' },
  devInput:        { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, fontSize: 15, color: '#fff', minHeight: 130, marginBottom: 12, borderWidth: 2, borderColor: '#334155', lineHeight: 22 },
  userAnswerBox:   { backgroundColor: '#0f172a', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  userAnswerLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  userAnswerText:  { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  selfEvalLabel:   { color: '#94a3b8', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', textAlign: 'center', marginVertical: 12, letterSpacing: 1 },
  selfBtn:         { flex: 1, borderRadius: 14, padding: 14, borderWidth: 2, alignItems: 'center', gap: 4 },
  selfBtnTxt:      { fontWeight: '900', fontSize: 14 },
  nextBtn:         { padding: 15, borderRadius: 14, alignItems: 'center' },
  nextBtnTxt:      { color: '#fff', fontWeight: '900', fontSize: 15 },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  resultEmoji:     { fontSize: 72, marginBottom: 16 },
  resultTitle:     { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8 },
  resultScore:     { fontSize: 18, color: '#94a3b8', marginBottom: 20 },
  resultPts:       { backgroundColor: '#fbbf24', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, marginBottom: 8 },
  resultPtsText:   { fontWeight: '900', fontSize: 16, color: '#0f172a' },
  resultSub:       { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  resultBtn:       { backgroundColor: '#1e40af', padding: 16, borderRadius: 14, width: '100%', alignItems: 'center' },
  resultBtnTxt:    { color: '#fff', fontWeight: '900', fontSize: 16 },
});
