import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { fmt, BASE_ALLOWANCE } from '../utils/logic';
import { C } from '../utils/styles';
import { COURSES, SUBJECTS, SECOND_LANGUAGE_OPTIONS } from '../data/questions';

export default function ParentScreen() {
  const { state, update, reset } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [settingNewPin, setSettingNewPin] = useState(!state.parentSetup);
  const [newPin1, setNewPin1] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [editCourse, setEditCourse] = useState(false);

  function tryUnlock() {
    if (pinInput === state.parentPin) {
      setUnlocked(true);
      setPinInput('');
      markAlertsRead();
    }
    else { Alert.alert('PIN incorrecto', 'Vuelve a intentarlo.'); setPinInput(''); }
  }

  function saveNewPin() {
    if (newPin1.length < 4) return Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos.');
    if (newPin1 !== newPin2) return Alert.alert('Error', 'Los PINs no coinciden.');
    update({ parentPin: newPin1, parentSetup: true });
    setSettingNewPin(false); setNewPin1(''); setNewPin2('');
    Alert.alert('✅ PIN configurado', 'El PIN de padres ha sido guardado.');
  }

  function markAlertsRead() {
    const updatedAlerts = (state.parentAlerts || []).map(a => ({ ...a, read: true }));
    update({ parentAlerts: updatedAlerts, unreadAlerts: 0 });
  }

  function confirmReset() {
    Alert.alert('⚠️ Reiniciar app', '¿Seguro? Se borrarán TODOS los datos del niño.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reiniciar', style: 'destructive', onPress: () => { reset(); setUnlocked(false); } },
    ]);
  }

  function addBalance(amount) {
    Alert.alert(`Añadir ${fmt(amount)}`, `¿Añadir ${fmt(amount)} al saldo de ${state.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Añadir', onPress: () => {
        const newBalance = state.balance + amount;
        const newHistory = [{ id: Date.now(), type: 'paga', amount, note: 'Añadido por padres', balanceAfter: newBalance, month: state.month, reason: 'full' }, ...state.history];
        update({ balance: newBalance, history: newHistory });
        Alert.alert('✅ Hecho', `${fmt(amount)} añadidos al saldo.`);
      }},
    ]);
  }

  // ── Configurar nuevo PIN ──
  if (settingNewPin) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor="#0f172a" barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.centered}>
          <Text style={styles.lockEmoji}>🔐</Text>
          <Text style={styles.lockTitle}>Configura el PIN de padres</Text>
          <Text style={styles.lockSub}>Este PIN protegerá la configuración. Asegúrate de recordarlo.</Text>
          <TextInput style={styles.pinInput} placeholder="Nuevo PIN (4+ dígitos)" placeholderTextColor="#64748b" secureTextEntry keyboardType="number-pad" maxLength={8} value={newPin1} onChangeText={setNewPin1} />
          <TextInput style={styles.pinInput} placeholder="Repetir PIN" placeholderTextColor="#64748b" secureTextEntry keyboardType="number-pad" maxLength={8} value={newPin2} onChangeText={setNewPin2} />
          <TouchableOpacity style={styles.unlockBtn} onPress={saveNewPin}>
            <Text style={styles.unlockBtnTxt}>Guardar PIN</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Pantalla de PIN ──
  if (!unlocked) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor="#0f172a" barStyle="light-content" />
        <View style={styles.centered}>
          <Text style={styles.lockEmoji}>🔒</Text>
          <Text style={styles.lockTitle}>Zona de padres</Text>
          <Text style={styles.lockSub}>Introduce el PIN para acceder a la configuración</Text>
          <TextInput style={styles.pinInput} placeholder="PIN..." placeholderTextColor="#64748b" secureTextEntry keyboardType="number-pad" maxLength={8} value={pinInput} onChangeText={setPinInput} />
          <TouchableOpacity style={styles.unlockBtn} onPress={tryUnlock}>
            <Text style={styles.unlockBtnTxt}>Entrar 🔓</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Panel de padres ──
  const courseInfo = COURSES.find(c => c.id === state.course);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar backgroundColor="#0f172a" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍👩‍👦 Panel de padres</Text>
        <TouchableOpacity onPress={() => setUnlocked(false)} style={styles.lockAgainBtn}>
          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700' }}>🔒 Cerrar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>


        {/* ── ESTADÍSTICAS DE JUEGO ── */}
        {(() => {
          const stats   = state.subjectStats || {};
          const entries = Object.entries(stats)
            .filter(([, s]) => s.rounds > 0)
            .sort((a, b) => b[1].rounds - a[1].rounds);

          if (entries.length === 0) return null;

          const maxCorrect = Math.max(...entries.map(([, s]) => s.correct + s.wrong), 1);

          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Estadísticas de juego</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
                Rendimiento por asignatura — {entries.reduce((a, [, s]) => a + s.rounds, 0)} rondas jugadas en total
              </Text>
              {entries.map(([key, s]) => {
                const subj     = key === 'segundo'
                  ? (SECOND_LANGUAGE_OPTIONS.find(l => l.key === (state.secondLanguage || 'frances')) || SECOND_LANGUAGE_OPTIONS[0])
                  : SUBJECTS[key];
                const label    = subj?.label || key;
                const emoji    = subj?.emoji || '📚';
                const color    = key === 'especial' ? '#7c3aed' : (SUBJECTS[key]?.color || '#64748b');
                const total    = s.correct + s.wrong;
                const pct      = total > 0 ? Math.round((s.correct / total) * 100) : 0;
                const barW     = total / maxCorrect;

                return (
                  <View key={key} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontWeight: '800', fontSize: 13, color: '#0f172a' }}>{emoji} {label}</Text>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>{s.rounds} ronda{s.rounds !== 1 ? 's' : ''} · {pct}% aciertos</Text>
                    </View>
                    {/* Barra de aciertos */}
                    <View style={{ backgroundColor: '#f1f5f9', borderRadius: 8, height: 14, overflow: 'hidden', marginBottom: 3 }}>
                      <View style={{ width: `${(s.correct / Math.max(total, 1)) * 100}%`, backgroundColor: color, height: '100%', borderRadius: 8 }} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Text style={{ fontSize: 11, color: '#22c55e' }}>✓ {s.correct} correctas</Text>
                      <Text style={{ fontSize: 11, color: '#ef4444' }}>✗ {s.wrong} errores</Text>
                    </View>
                  </View>
                );
              })}

              {/* Resumen global */}
              {(() => {
                const totalC = entries.reduce((a, [, s]) => a + s.correct, 0);
                const totalW = entries.reduce((a, [, s]) => a + s.wrong, 0);
                const globalPct = totalC + totalW > 0 ? Math.round((totalC / (totalC + totalW)) * 100) : 0;
                const bestEntry = entries.length > 0 ? entries.reduce((a, b) => {
                  const aPct = a[1].correct / Math.max(a[1].correct + a[1].wrong, 1);
                  const bPct = b[1].correct / Math.max(b[1].correct + b[1].wrong, 1);
                  return bPct > aPct ? b : a;
                }) : null;
                const worstEntry = entries.length > 0 ? entries.reduce((a, b) => {
                  const aPct = a[1].correct / Math.max(a[1].correct + a[1].wrong, 1);
                  const bPct = b[1].correct / Math.max(b[1].correct + b[1].wrong, 1);
                  return bPct < aPct ? b : a;
                }) : null;

                return (
                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                    <Text style={{ fontWeight: '800', fontSize: 12, color: '#475569', marginBottom: 8 }}>RESUMEN GLOBAL</Text>
                    <Text style={{ fontSize: 13, color: '#0f172a', lineHeight: 22 }}>
                      {'🎯 Acierto global: '}<Text style={{ fontWeight: '900', color: globalPct >= 75 ? '#22c55e' : '#ef4444' }}>{globalPct}%</Text>
                    </Text>
                    {bestEntry && (
                      <Text style={{ fontSize: 13, color: '#0f172a', lineHeight: 22 }}>
                        {'⭐ Mejor asignatura: '}<Text style={{ fontWeight: '900' }}>
                          {bestEntry[0] === 'segundo'
                            ? (SECOND_LANGUAGE_OPTIONS.find(l => l.key === (state.secondLanguage || 'frances'))?.label || 'Segundo idioma')
                            : (SUBJECTS[bestEntry[0]]?.label || bestEntry[0])}
                        </Text>
                      </Text>
                    )}
                    {worstEntry && worstEntry[0] !== bestEntry[0] && (
                      <Text style={{ fontSize: 13, color: '#0f172a', lineHeight: 22 }}>
                        {'📚 Más dificultad: '}<Text style={{ fontWeight: '900' }}>
                          {worstEntry[0] === 'segundo'
                            ? (SECOND_LANGUAGE_OPTIONS.find(l => l.key === (state.secondLanguage || 'frances'))?.label || 'Segundo idioma')
                            : (SUBJECTS[worstEntry[0]]?.label || worstEntry[0])}
                        </Text>
                      </Text>
                    )}
                  </View>
                );
              })()}
            </View>
          );
        })()}

        {/* ── ALERTAS ── */}
        {(state.parentAlerts || []).length > 0 && (
          <View style={[styles.card, { borderWidth: 2, borderColor: '#fca5a5', backgroundColor: '#fff5f5' }]}>
            <Text style={[styles.cardTitle, { color: '#dc2626' }]}>🚨 Alertas de gasto</Text>
            {(state.parentAlerts || []).slice(0, 5).map(alert => (
              <View key={alert.id} style={[styles.alertRow, !alert.read && styles.alertRowUnread]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>
                    {!alert.read && <Text style={{ color: '#dc2626' }}>● </Text>}
                    ⛔ Capricho: gastó {fmt(alert.amount)}
                    {alert.note && alert.note !== 'Gasto' ? ` en "${alert.note}"` : ''}
                  </Text>
                  <Text style={styles.alertSub}>
                    {alert.date} · Paga: {fmt(alert.allowance)} · Límite 50%: {fmt(alert.threshold)} · Total gastado: {fmt(alert.totalSpent)}
                  </Text>
                  <Text style={[styles.alertSub, { color: '#dc2626', fontWeight: '700', marginTop: 2 }]}>
                    → Próxima paga: 0 € (penalización activada)
                  </Text>
                </View>
              </View>
            ))}
            {(state.parentAlerts || []).length > 5 && (
              <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                +{state.parentAlerts.length - 5} alertas anteriores
              </Text>
            )}
          </View>
        )}

        {/* Resumen hijo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👦 Perfil de {state.name}</Text>
          <Text style={styles.infoRow}>Avatar: <Text style={styles.infoVal}>{state.avatar} {state.name}</Text></Text>
          <Text style={styles.infoRow}>Curso: <Text style={styles.infoVal}>{courseInfo?.label} ({courseInfo?.age})</Text></Text>
          <Text style={styles.infoRow}>Saldo actual: <Text style={[styles.infoVal, { color: C.green }]}>{fmt(state.balance)}</Text></Text>
          <Text style={styles.infoRow}>Puntos totales: <Text style={styles.infoVal}>⭐ {state.totalPoints}</Text></Text>
          <Text style={styles.infoRow}>Racha actual: <Text style={styles.infoVal}>🔥 {state.streak} días</Text></Text>
          <Text style={styles.infoRow}>Paga actual: <Text style={styles.infoVal}>{fmt(state.allowance)}/mes</Text></Text>
          <Text style={styles.infoRow}>Gastado este mes: <Text style={[styles.infoVal, { color: state.monthSpent > state.allowance * 0.5 ? C.red : C.dark }]}>{fmt(state.monthSpent)}</Text></Text>
        </View>

        {/* Cambiar curso */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={styles.cardTitle}>🎓 Curso</Text>
            <TouchableOpacity onPress={() => setEditCourse(!editCourse)}>
              <Text style={{ color: '#1e40af', fontWeight: '800', fontSize: 13 }}>{editCourse ? 'Cancelar' : 'Cambiar'}</Text>
            </TouchableOpacity>
          </View>
          {!editCourse ? (
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark }}>{courseInfo?.emoji} {courseInfo?.label}</Text>
          ) : (
            COURSES.map(c => (
              <TouchableOpacity key={c.id} style={[styles.courseRow, state.course === c.id && styles.courseRowActive]} onPress={() => { update({ course: c.id }); setEditCourse(false); }}>
                <Text style={{ fontWeight: '700', color: state.course === c.id ? '#fff' : C.dark }}>{c.emoji} {c.label}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Añadir dinero */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Añadir dinero manualmente</Text>
          <Text style={{ fontSize: 12, color: C.gray, marginBottom: 12 }}>Para premios especiales o ajustes</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[0.50, 1, 2, 5].map(amt => (
              <TouchableOpacity key={amt} style={styles.addBtn} onPress={() => addBalance(amt)}>
                <Text style={styles.addBtnTxt}>+{fmt(amt)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cambiar PIN */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔐 Cambiar PIN</Text>
          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: '#1e40af' }]} onPress={() => { setSettingNewPin(true); setUnlocked(false); }}>
            <Text style={styles.bigBtnTxt}>Cambiar PIN de padres</Text>
          </TouchableOpacity>
        </View>

        {/* Reiniciar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Zona peligrosa</Text>
          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: C.red }]} onPress={confirmReset}>
            <Text style={styles.bigBtnTxt}>Reiniciar toda la app</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#0f172a' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockEmoji:      { fontSize: 64, marginBottom: 16 },
  lockTitle:      { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 },
  lockSub:        { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  pinInput:       { borderWidth: 2, borderColor: '#334155', borderRadius: 14, padding: 16, fontSize: 24, fontWeight: '900', color: '#fff', width: '100%', marginBottom: 12, backgroundColor: '#1e293b', textAlign: 'center', letterSpacing: 8 },
  unlockBtn:      { backgroundColor: '#1e40af', padding: 16, borderRadius: 14, width: '100%', alignItems: 'center' },
  unlockBtnTxt:   { color: '#fff', fontWeight: '900', fontSize: 17 },
  header:         { backgroundColor: '#0f172a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 8 },
  headerTitle:    { fontSize: 20, fontWeight: '900', color: '#fff' },
  lockAgainBtn:   { backgroundColor: '#1e293b', borderRadius: 8, padding: 8 },
  card:           { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, elevation: 2 },
  cardTitle:      { fontWeight: '800', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  infoRow:        { fontSize: 13, color: '#64748b', lineHeight: 26 },
  infoVal:        { fontWeight: '800', color: '#0f172a' },
  bigBtn:         { padding: 15, borderRadius: 14, alignItems: 'center' },
  bigBtnTxt:      { color: '#fff', fontWeight: '800', fontSize: 15 },
  addBtn:         { flex: 1, backgroundColor: C.greenBg, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: C.greenBd },
  addBtnTxt:      { fontWeight: '900', color: C.green, fontSize: 13 },
  alertRow:       { backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#fca5a5' },
  alertRowUnread: { borderLeftColor: '#dc2626', backgroundColor: '#fee2e2' },
  alertTitle:     { fontWeight: '800', fontSize: 13, color: '#7f1d1d', marginBottom: 4 },
  alertSub:       { fontSize: 11, color: '#b91c1c', lineHeight: 16 },
  courseRow:      { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 6 },
  courseRowActive:{ backgroundColor: '#1e40af' },
});
