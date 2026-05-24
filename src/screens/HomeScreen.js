import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { fmt, calcNextAllowance, BASE_ALLOWANCE, POINTS_TO_CENTS } from '../utils/logic';
import { C } from '../utils/styles';
import { SUBJECTS, COURSES } from '../data/questions';

function greeting() {
  const h = new Date().getHours();
  if (h < 13) return '¡Buenos días';
  if (h < 21) return '¡Buenas tardes';
  return '¡Buenas noches';
}

export default function HomeScreen({ navigation }) {
  const { state } = useApp();
  const { name, avatar, course, balance, allowance, monthSpent, recoveryLevel, totalPoints, availablePoints, streak } = state;

  const courseInfo = COURSES.find(c => c.id === course);
  const { amount: nextAmount, reason: nextReason } = calcNextAllowance(allowance, monthSpent, recoveryLevel);
  const nextColor = nextAmount >= BASE_ALLOWANCE ? C.green : nextAmount >= 6 ? C.yellow : nextAmount >= 2 ? C.orange : C.red;
  const nextBg    = nextAmount >= BASE_ALLOWANCE ? C.greenBg : nextAmount >= 6 ? C.yellowBg : nextAmount >= 2 ? C.orangeBg : C.redBg;
  const pointsToNextCent = POINTS_TO_CENTS - (availablePoints % POINTS_TO_CENTS);
  const centsEarned = Math.floor(availablePoints / POINTS_TO_CENTS) * 0.10;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#0f172a" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting()}, {name}! {avatar}</Text>
            <Text style={styles.course}>{courseInfo?.label} · {courseInfo?.age}</Text>
          </View>
          {streak > 1 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
          )}
        </View>

        {/* Saldo */}
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>💳 Saldo</Text>
            <Text style={styles.balanceAmt}>{fmt(balance)}</Text>
          </View>
          <View style={styles.balanceSep} />
          <View>
            <Text style={styles.balanceLabel}>⭐ Puntos</Text>
            <Text style={styles.balanceAmt}>{totalPoints}</Text>
          </View>
        </View>

        {/* Próxima paga */}
        <View style={[styles.nextPill, { backgroundColor: nextBg }]}>
          <Text style={[styles.nextLabel, { color: nextColor }]}>
            {nextReason === 'penalty' ? '⛔ Penalización' : nextReason === 'recovery' ? '🔄 Recuperación' : nextReason === 'full' ? '✅ Paga completa' : '📉 Paga reducida'}
          </Text>
          <Text style={[styles.nextAmt, { color: nextColor }]}>{fmt(nextAmount)} próximo mes</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* Puntos → Euros */}
        {availablePoints > 0 && (
          <View style={[styles.card, { backgroundColor: '#fefce8', borderWidth: 2, borderColor: '#fde047' }]}>
            <Text style={styles.cardTitle}>⭐ Puntos pendientes de convertir</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#b45309' }}>{availablePoints} pts</Text>
                <Text style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>= {(availablePoints / POINTS_TO_CENTS * 0.10).toFixed(2).replace('.', ',')} € · Faltan {pointsToNextCent} pts para 0,10 € más</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: '#b45309', padding: 12, borderRadius: 12 }} onPress={() => navigation.navigate('Paga')}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Cobrar →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Acceso rápido Juegos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎮 Juega y gana dinero</Text>
          <Text style={{ fontSize: 12, color: C.gray, marginBottom: 14, lineHeight: 18 }}>
            Cada respuesta correcta = 10 puntos · 50 puntos = 0,10 € en tu saldo
          </Text>
          <View style={styles.subjectsGrid}>
            {Object.entries(SUBJECTS).map(([key, sub]) => (
              <TouchableOpacity
                key={key}
                style={[styles.subjectBtn, { borderColor: sub.color + '44', backgroundColor: sub.color + '11' }]}
                onPress={() => navigation.navigate('Juegos', { subject: key })}
              >
                <Text style={styles.subjectEmoji}>{sub.emoji}</Text>
                <Text style={[styles.subjectLabel, { color: sub.color }]}>{sub.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resumen paga */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Paga')}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.cardTitle}>💰 Mi paga</Text>
              <Text style={{ fontSize: 12, color: C.gray }}>Paga actual: {fmt(allowance)} · Gastado: {fmt(monthSpent)}</Text>
              <Text style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Puedes gastar hasta: {fmt(allowance / 2)}</Text>
            </View>
            <Text style={{ fontSize: 24, color: C.primary }}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Reglas rápidas */}
        <View style={[styles.card, { backgroundColor: '#eff6ff' }]}>
          <Text style={styles.cardTitle}>📖 Cómo funciona</Text>
          {[
            ['🎮', 'Juega y acumula puntos por asignatura'],
            ['⭐', '50 puntos = 0,10 € que se añaden a tu saldo'],
            ['💰', 'Tu paga mensual depende de cuánto gastas'],
            ['📉', 'Gasta > 50% de tu paga → mes de penalización'],
            ['🔄', 'Si llegas a 0 €, recuperas 2 € por mes sin gastar'],
          ].map(([e, t], i) => (
            <Text key={i} style={{ fontSize: 12, color: '#1e3a5f', lineHeight: 24 }}>{e} {t}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0f172a' },
  header:       { backgroundColor: '#0f172a', padding: 20, paddingTop: 8 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting:     { fontSize: 20, fontWeight: '900', color: '#fff' },
  course:       { fontSize: 12, color: '#64748b', marginTop: 2 },
  streakBadge:  { backgroundColor: '#f97316', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  streakText:   { color: '#fff', fontWeight: '900', fontSize: 14 },
  balanceRow:   { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' },
  balanceSep:   { width: 1, height: 40, backgroundColor: '#334155', marginHorizontal: 20 },
  balanceLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  balanceAmt:   { fontSize: 26, fontWeight: '900', color: '#fff' },
  nextPill:     { borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextLabel:    { fontSize: 12, fontWeight: '800' },
  nextAmt:      { fontSize: 16, fontWeight: '900' },
  card:         { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, elevation: 2 },
  cardTitle:    { fontWeight: '800', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectBtn:   { borderRadius: 12, padding: 12, borderWidth: 2, alignItems: 'center', width: '47%' },
  subjectEmoji: { fontSize: 24, marginBottom: 4 },
  subjectLabel: { fontWeight: '800', fontSize: 13 },
});
