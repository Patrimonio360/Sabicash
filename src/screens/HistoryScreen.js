import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useApp } from '../context/AppContext';
import { fmt } from '../utils/logic';
import { C } from '../utils/styles';
import { SUBJECTS } from '../data/questions';

export default function HistoryScreen() {
  const { state } = useApp();
  const [filter, setFilter] = useState('all');

  const allItems = [
    ...state.history.map(h => ({ ...h, category: 'pago' })),
    ...state.gameHistory.map(h => ({ ...h, category: 'juego' })),
  ].sort((a, b) => b.id - a.id);

  const filtered = filter === 'all' ? allItems : allItems.filter(i => i.category === filter);

  function pill(label, bg, color) {
    return <View style={[styles.pill, { backgroundColor: bg }]}><Text style={[styles.pillTxt, { color }]}>{label}</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar backgroundColor="#0f172a" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Historial</Text>
        <Text style={styles.headerSub}>⭐ {state.totalPoints} pts totales · 🔥 Racha: {state.streak} días</Text>
      </View>

      <View style={styles.filters}>
        {[['all','Todo'],['pago','💰 Paga'],['juego','🎮 Juegos']].map(([k,l]) => (
          <TouchableOpacity key={k} style={[styles.filterBtn, filter === k && styles.filterBtnActive]} onPress={() => setFilter(k)}>
            <Text style={[styles.filterTxt, filter === k && styles.filterTxtActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={styles.card}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>Sin movimientos aún{'\n'}¡Cobra la paga y empieza a jugar! 💪</Text>
          ) : filtered.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 2 }}>
                  <Text style={styles.txNote}>
                    {tx.category === 'juego'
                      ? `${SUBJECTS[tx.subject]?.emoji || '🎮'} ${SUBJECTS[tx.subject]?.label || 'Juego'}`
                      : tx.type === 'paga' ? '💰 ' + tx.note : '🛍️ ' + tx.note}
                  </Text>
                  {tx.reason === 'full'     && pill('✓ COMPLETA', C.greenBg, C.green)}
                  {tx.reason === 'reduced'  && pill('REDUCIDA',   C.yellowBg, C.yellow)}
                  {tx.reason === 'recovery' && pill('RECUP.',     C.orangeBg, C.orange)}
                  {tx.penalty               && pill('⛔ CAPRICHO', C.redBg, C.red)}
                </View>
                <Text style={styles.txMeta}>
                  {tx.date || new Date(tx.id).toLocaleDateString('es-ES')}
                  {tx.category === 'pago' && tx.balanceAfter !== undefined ? ` · Saldo: ${fmt(tx.balanceAfter)}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {tx.category === 'juego' ? (
                  <>
                    <Text style={[styles.txAmt, { color: '#b45309' }]}>+{tx.points} pts</Text>
                    {tx.euros > 0 && <Text style={{ fontSize: 11, color: C.green, fontWeight: '700' }}>+{tx.euros.toFixed(2).replace('.', ',')} €</Text>}
                  </>
                ) : (
                  <Text style={[styles.txAmt, { color: tx.type === 'paga' ? C.green : C.red }]}>
                    {tx.type === 'paga' ? '+' : '−'}{fmt(tx.amount)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:        { backgroundColor: '#0f172a', padding: 20, paddingTop: 8 },
  headerTitle:   { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSub:     { fontSize: 12, color: '#64748b', marginTop: 4 },
  filters:       { flexDirection: 'row', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterBtn:     { flex: 1, padding: 8, borderRadius: 99, backgroundColor: '#1e293b', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#1e40af' },
  filterTxt:     { fontWeight: '700', fontSize: 12, color: '#64748b' },
  filterTxtActive: { color: '#fff' },
  card:          { backgroundColor: '#fff', borderRadius: 20, padding: 18, elevation: 2 },
  empty:         { textAlign: 'center', color: C.lightGray, padding: 28, fontSize: 13, lineHeight: 22 },
  txRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txNote:        { fontWeight: '700', fontSize: 13, color: '#0f172a' },
  txMeta:        { fontSize: 11, color: C.lightGray, marginTop: 2 },
  txAmt:         { fontWeight: '900', fontSize: 15 },
  pill:          { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  pillTxt:       { fontSize: 10, fontWeight: '800' },
});
