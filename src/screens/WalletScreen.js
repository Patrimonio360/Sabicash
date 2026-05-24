import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { fmt, calcNextAllowance, BASE_ALLOWANCE } from '../utils/logic';
import { C } from '../utils/styles';

// ── Utilidades de fecha ──────────────────────────────────────
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayFormatted() {
  return new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function buildDateOptions() {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
    const value = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    options.push({ label: i === 0 ? `Hoy · ${value}` : i === 1 ? `Ayer · ${value}` : label + ' · ' + value, value });
  }
  return options;
}

const DATE_OPTIONS = buildDateOptions();

// ── Categorías de gasto ──────────────────────────────────────
const CATEGORIES = [
  { id: 'comida',   label: 'Comida',      emoji: '🍔' },
  { id: 'ocio',     label: 'Ocio',        emoji: '🎮' },
  { id: 'ropa',     label: 'Ropa',        emoji: '👟' },
  { id: 'transporte', label: 'Transporte', emoji: '🚌' },
  { id: 'material', label: 'Material',    emoji: '📚' },
  { id: 'otro',     label: 'Otro',        emoji: '💸' },
];

export default function WalletScreen() {
  const { state, update } = useApp();
  const { balance, allowance, monthSpent, recoveryLevel, month, pagoStarted, history, lastPaymentMonth } = state;

  // ── Form gasto ──
  const [spendAmt,   setSpendAmt]   = useState('');
  const [spendNote,  setSpendNote]  = useState('');
  const [spendCat,   setSpendCat]   = useState(null);
  const [spendDate,  setSpendDate]  = useState(todayFormatted());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showForm,   setShowForm]   = useState(false);

  const threshold = allowance * 0.5;
  const { amount: nextAmount, newRecoveryLevel: nextRecLevel, reason: nextReason } =
    calcNextAllowance(allowance, monthSpent, recoveryLevel);

  const previewAmt = parseFloat(spendAmt.replace(',', '.')) || 0;
  const willPenalize = previewAmt > 0 && (monthSpent + previewAmt) > threshold;

  const nextColor = nextAmount >= BASE_ALLOWANCE ? C.green : nextAmount >= 6 ? C.yellow : nextAmount >= 2 ? C.orange : C.red;
  const nextBg    = nextAmount >= BASE_ALLOWANCE ? C.greenBg : nextAmount >= 6 ? C.yellowBg : nextAmount >= 2 ? C.orangeBg : C.redBg;

  // ── Cobrar paga ──
  function cobrarPaga() {
    // ── Solo se puede cobrar una vez al mes ──
    const mesActual = currentMonthKey();
    if (lastPaymentMonth === mesActual) {
      Alert.alert(
        '📅 Ya cobraste este mes',
        'La paga solo se puede cobrar una vez al mes. Vuelve el mes que viene.'
      );
      return;
    }

    const { amount: paga, newRecoveryLevel: newRecLevel } = pagoStarted
      ? calcNextAllowance(allowance, monthSpent, recoveryLevel)
      : { amount: BASE_ALLOWANCE, newRecoveryLevel: 0 };

    const newBalance = balance + paga;
    const newHistory = [{
      id: Date.now(), type: 'paga', amount: paga,
      note: `Paga mes ${month}`, balanceAfter: newBalance, month,
      reason: newRecLevel > 0 ? 'recovery' : paga >= BASE_ALLOWANCE ? 'full' : 'reduced',
      date: todayFormatted(),
    }, ...history];

    update({
      balance: newBalance, allowance: paga, monthSpent: 0,
      recoveryLevel: newRecLevel, month: month + 1,
      pagoStarted: true, history: newHistory,
      lastPaymentMonth: mesActual,  // bloqueo mensual
    });
    Alert.alert('💰 ¡Cobrado!', `Has cobrado ${fmt(paga)} de paga. Siguiente paga disponible el mes que viene.`);
  }

  // ── Registrar gasto ──
  function gastar() {
    const amt = parseFloat(spendAmt.replace(',', '.'));
    if (!amt || amt <= 0)    return Alert.alert('Importe incorrecto', 'Escribe un importe válido.');
    if (!spendNote.trim())   return Alert.alert('Escribe el concepto', '¿En qué has gastado el dinero?');
    if (!spendCat)           return Alert.alert('Elige categoría', 'Selecciona una categoría para el gasto.');
    if (!pagoStarted)        return Alert.alert('Primero cobra la paga', 'Pulsa "Cobrar paga" para empezar.');
    if (allowance === 0)     return Alert.alert('🚫 Mes de penalización', 'Este mes no puedes gastar nada.');
    if (amt > balance)       return Alert.alert('Sin saldo', `Solo tienes ${fmt(balance)} disponibles.`);

    if (willPenalize) {
      Alert.alert(
        '⛔ ¡Superarás el 50%!',
        `Gastar ${fmt(amt)} te deja sin paga el mes que viene (0 €) y tendrás que recuperar de 2 en 2 €.\n\n¿Seguro que quieres gastar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sí, gastar', style: 'destructive', onPress: () => doGasto(amt, true) },
        ]
      );
    } else {
      doGasto(amt, false);
    }
  }

  function doGasto(amt, isPenalty) {
    const cat       = CATEGORIES.find(c => c.id === spendCat);
    const newBalance = balance - amt;
    const newSpent   = monthSpent + amt;
    const entry = {
      id:          Date.now(),
      type:        'gasto',
      amount:      amt,
      note:        spendNote.trim(),
      category:    spendCat,
      categoryEmoji: cat?.emoji || '💸',
      categoryLabel: cat?.label || 'Otro',
      date:        spendDate,
      balanceAfter: newBalance,
      month,
      penalty:     isPenalty,
    };

    const patch = { balance: newBalance, monthSpent: newSpent, history: [entry, ...history] };

    if (isPenalty) {
      const alert = {
        id:         Date.now(),
        type:       'penalty',
        date:       spendDate,
        amount:     amt,
        note:       spendNote.trim(),
        category:   cat?.label || 'Otro',
        allowance,
        threshold,
        totalSpent: newSpent,
        read:       false,
      };
      patch.parentAlerts = [alert, ...(state.parentAlerts || [])];
      patch.unreadAlerts = (state.unreadAlerts || 0) + 1;
    }

    update(patch);
    setSpendAmt(''); setSpendNote(''); setSpendCat(null); setSpendDate(todayFormatted());
    setShowForm(false);
    Alert.alert(
      isPenalty ? '⛔ Gasto registrado' : '✅ Gasto registrado',
      `${fmt(amt)} en "${spendNote.trim()}" el ${spendDate}.${isPenalty ? '\n\nPróxima paga: 0 €.' : ''}`,
    );
  }

  // ── Últimos gastos (solo tipo gasto) ──
  const recentGastos = history.filter(h => h.type === 'gasto').slice(0, 8);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0f172a" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>💳 Saldo disponible</Text>
        <Text style={styles.headerBalance}>{fmt(balance)}</Text>
        <Text style={styles.headerSub}>Mes {month} · Paga: {fmt(allowance)} · Gastado: {fmt(monthSpent)}</Text>
        <View style={[styles.nextPill, { backgroundColor: nextBg }]}>
          <Text style={[styles.nextLabel, { color: nextColor }]}>
            {nextReason === 'penalty' ? '⛔ Penalización' : nextReason === 'recovery' ? '🔄 Recuperación' : nextReason === 'full' ? '✅ Paga completa' : '📉 Reducida'}
          </Text>
          <Text style={[styles.nextAmt, { color: nextColor }]}>{fmt(nextAmount)} próximo mes</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* ── COBRAR PAGA ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Cobrar paga</Text>
          <View style={[styles.infoBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#1e40af', fontSize: 15 }}>
                {!pagoStarted ? 'Primera paga' : nextReason === 'penalty' ? 'Mes de penalización' : nextReason === 'recovery' ? `Recuperación` : monthSpent === 0 ? 'Mes limpio ✅' : `Gastaste ${fmt(monthSpent)}`}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Mes {month}</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#1e40af' }}>{fmt(pagoStarted ? nextAmount : BASE_ALLOWANCE)}</Text>
          </View>
          {/* Bloqueo mensual */}
          {lastPaymentMonth === currentMonthKey()
            ? (
              <View style={[styles.bigBtn, { backgroundColor: '#94a3b8' }]}>
                <Text style={styles.bigBtnTxt}>✓ Ya cobraste este mes</Text>
              </View>
            ) : (
              <TouchableOpacity style={[styles.bigBtn, { backgroundColor: C.green }]} onPress={cobrarPaga}>
                <Text style={styles.bigBtnTxt}>+ Cobrar {fmt(pagoStarted ? nextAmount : BASE_ALLOWANCE)}</Text>
              </TouchableOpacity>
            )
          }
        </View>

        {/* ── LÍMITES ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚦 Límites este mes</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[styles.limitBox, { backgroundColor: C.greenBg, borderColor: C.greenBd, flex: 1 }]}>
              <Text style={styles.limitLabel}>✅ Sin penalización</Text>
              <Text style={[styles.limitAmt, { color: C.green }]}>{fmt(Math.max(0, threshold - monthSpent))}</Text>
              <Text style={styles.limitSub}>te quedan</Text>
            </View>
            <View style={[styles.limitBox, { backgroundColor: C.redBg, borderColor: C.redBd, flex: 1 }]}>
              <Text style={styles.limitLabel}>⛔ Límite 50%</Text>
              <Text style={[styles.limitAmt, { color: C.red }]}>{fmt(threshold)}</Text>
              <Text style={styles.limitSub}>total del mes</Text>
            </View>
          </View>
          {allowance === 0 && (
            <View style={{ backgroundColor: C.redBg, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 2, borderColor: C.redBd }}>
              <Text style={{ fontWeight: '900', color: '#991b1b', textAlign: 'center' }}>🚫 Mes de penalización — no puedes gastar</Text>
            </View>
          )}
        </View>

        {/* ── BOTÓN REGISTRAR GASTO ── */}
        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: allowance === 0 ? C.lightGray : '#1e40af', marginBottom: 12 }]}
          onPress={() => allowance === 0 ? Alert.alert('🚫 Mes de penalización', 'Este mes no puedes gastar nada.') : setShowForm(true)}
        >
          <Text style={styles.bigBtnTxt}>💸 Registrar nuevo gasto</Text>
        </TouchableOpacity>

        {/* ── ÚLTIMOS GASTOS ── */}
        {recentGastos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧾 Últimos gastos</Text>
            {recentGastos.map(tx => (
              <View key={tx.id} style={styles.txRow}>
                <Text style={{ fontSize: 24 }}>{tx.categoryEmoji || '💸'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txNote}>{tx.note}</Text>
                  <Text style={styles.txMeta}>{tx.date} · {tx.categoryLabel || 'Gasto'}{tx.penalty ? ' · ⛔ capricho' : ''}</Text>
                </View>
                <Text style={[styles.txAmt, { color: C.red }]}>−{fmt(tx.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── PRÓXIMA PAGA CALCULADA ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Cálculo próxima paga</Text>
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 14 }}>
            <Text style={styles.calcRow}>💰 Paga actual: <Text style={{ fontWeight: '800' }}>{fmt(allowance)}</Text></Text>
            <Text style={styles.calcRow}>🛍️ Gastado: <Text style={{ fontWeight: '800', color: monthSpent > threshold ? C.red : C.dark }}>{fmt(monthSpent)}</Text></Text>
            {monthSpent > 0 && monthSpent <= threshold && (
              <Text style={styles.calcRow}>✂️ Penalización ×2: <Text style={{ fontWeight: '800', color: C.red }}>−{fmt(monthSpent * 2)}</Text></Text>
            )}
            <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
            <Text style={[styles.calcRow, { fontWeight: '900', fontSize: 15, color: nextColor }]}>📬 Próxima paga: {fmt(nextAmount)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── MODAL FORMULARIO GASTO ── */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💸 Nuevo gasto</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <Text style={{ color: '#64748b', fontSize: 18, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* FIX Bug 2: explicacion clara del margen disponible */}
              <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1.5, borderColor: '#86efac' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#166534', marginBottom: 4 }}>💡 ¿Cuanto puedo gastar sin penalizacion?</Text>
                <Text style={{ fontSize: 13, color: '#15803d', lineHeight: 20 }}>
  {`Tu paga es de ${fmt(allowance)}. El limite es el 50% = ${fmt(threshold)}.\nYa has gastado ${fmt(monthSpent)}, asi que puedes gastar hasta ${fmt(Math.max(0, threshold - monthSpent))} mas este mes sin perder la paga del mes que viene.`}
</Text>
              </View>

              {/* Importe */}
              <Text style={styles.fieldLabel}>Importe *</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder={`Máx. sin penalización: ${fmt(Math.max(0, threshold - monthSpent))}`}
                placeholderTextColor="#94a3b8"
                value={spendAmt}
                onChangeText={setSpendAmt}
              />

              {/* Previsualización penalización */}
              {previewAmt > 0 && (
                <View style={{ backgroundColor: willPenalize ? C.redBg : C.greenBg, borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1.5, borderColor: willPenalize ? C.red : C.green }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: willPenalize ? '#991b1b' : '#065f46' }}>
                    {willPenalize
                      ? `⛔ Superarás el límite → próxima paga: 0 €`
                      : `✅ Próxima paga: ${fmt(calcNextAllowance(allowance, monthSpent + previewAmt, recoveryLevel).amount)}`}
                  </Text>
                </View>
              )}

              {/* Concepto */}
              <Text style={styles.fieldLabel}>Concepto *</Text>
              <TextInput
                style={styles.input}
                placeholder="¿En qué has gastado? (ej: patatas fritas, cómic...)"
                placeholderTextColor="#94a3b8"
                value={spendNote}
                onChangeText={setSpendNote}
                maxLength={60}
              />

              {/* Categoría */}
              <Text style={styles.fieldLabel}>Categoría *</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catBtn, spendCat === cat.id && styles.catBtnActive]}
                    onPress={() => setSpendCat(cat.id)}
                  >
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catLabel, spendCat === cat.id && { color: '#fff' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Fecha */}
              <Text style={styles.fieldLabel}>Fecha *</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateBtnEmoji}>📅</Text>
                <Text style={styles.dateBtnTxt}>{spendDate}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>cambiar ›</Text>
              </TouchableOpacity>

              {/* Botón guardar */}
              <TouchableOpacity
                style={[styles.bigBtn, { backgroundColor: willPenalize && previewAmt > 0 ? C.red : '#1e40af', marginTop: 16 }]}
                onPress={gastar}
              >
                <Text style={styles.bigBtnTxt}>
                  {willPenalize && previewAmt > 0 ? '⛔ Guardar (con penalización)' : '✅ Guardar gasto'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.bigBtn, { backgroundColor: C.lightGray, marginTop: 8 }]} onPress={() => setShowForm(false)}>
                <Text style={styles.bigBtnTxt}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL SELECTOR DE FECHA ── */}
      <Modal visible={showDatePicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Selecciona la fecha</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={{ color: '#64748b', fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={DATE_OPTIONS}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dateOption, spendDate === item.value && styles.dateOptionActive]}
                  onPress={() => { setSpendDate(item.value); setShowDatePicker(false); }}
                >
                  <Text style={[styles.dateOptionTxt, spendDate === item.value && { color: '#fff' }]}>{item.label}</Text>
                  {spendDate === item.value && <Text style={{ color: '#fff' }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#0f172a' },
  header:        { backgroundColor: '#0f172a', padding: 20, paddingTop: 8 },
  headerLabel:   { fontSize: 12, color: '#64748b', marginBottom: 4 },
  headerBalance: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  headerSub:     { fontSize: 12, color: '#64748b', marginTop: 2 },
  nextPill:      { borderRadius: 12, padding: 12, marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextLabel:     { fontSize: 12, fontWeight: '800' },
  nextAmt:       { fontSize: 18, fontWeight: '900' },
  card:          { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, elevation: 2 },
  cardTitle:     { fontWeight: '800', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  infoBox:       { borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2 },
  bigBtn:        { padding: 15, borderRadius: 14, alignItems: 'center' },
  bigBtnTxt:     { color: '#fff', fontWeight: '800', fontSize: 15 },
  limitBox:      { borderRadius: 14, padding: 14, borderWidth: 2, alignItems: 'center' },
  limitLabel:    { fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 4 },
  limitAmt:      { fontSize: 22, fontWeight: '900' },
  limitSub:      { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  txRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10 },
  txNote:        { fontWeight: '700', fontSize: 13, color: C.dark },
  txMeta:        { fontSize: 11, color: C.lightGray, marginTop: 2 },
  txAmt:         { fontWeight: '900', fontSize: 15 },
  calcRow:       { fontSize: 13, color: '#475569', lineHeight: 26 },
  // Modal
  modalOverlay:  { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, maxHeight: '90%' },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:    { fontSize: 18, fontWeight: '900', color: C.dark },
  fieldLabel:    { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input:         { borderWidth: 2, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 16, backgroundColor: '#f8fafc' },
  catGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 2, borderColor: '#e2e8f0', gap: 6 },
  catBtnActive:  { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  catEmoji:      { fontSize: 18 },
  catLabel:      { fontWeight: '700', fontSize: 13, color: C.dark },
  dateBtn:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14, borderWidth: 2, borderColor: C.border, gap: 10, marginBottom: 8 },
  dateBtnEmoji:  { fontSize: 20 },
  dateBtnTxt:    { flex: 1, fontWeight: '700', fontSize: 15, color: C.dark },
  dateOption:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 4 },
  dateOptionActive: { backgroundColor: '#1e40af' },
  dateOptionTxt: { fontSize: 14, fontWeight: '600', color: C.dark },
});
