import { StyleSheet } from 'react-native';

export const C = {
  bg:       '#f1f5f9',
  card:     '#ffffff',
  primary:  '#1e40af',
  dark:     '#0f172a',
  gray:     '#64748b',
  lightGray:'#94a3b8',
  border:   '#e2e8f0',
  green:    '#059669',
  greenBg:  '#d1fae5',
  greenBd:  '#bbf7d0',
  red:      '#dc2626',
  redBg:    '#fee2e2',
  redBd:    '#fca5a5',
  orange:   '#ea580c',
  orangeBg: '#ffedd5',
  yellow:   '#d97706',
  yellowBg: '#fef3c7',
  blue:     '#3b82f6',
  blueBg:   '#dbeafe',
};

export const S = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.dark },
  scroll:    { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 16, paddingBottom: 32 },
  card:      { backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  label:     { fontWeight: '800', fontSize: 11, color: C.lightGray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  bigBtn:    { padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  bigBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  input:     { borderWidth: 2, borderColor: C.border, borderRadius: 12, padding: 13, fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 8, backgroundColor: C.card },
  infoBox:   { borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2 },
  row:       { flexDirection: 'row', alignItems: 'center' },
  between:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

export function btn(color) {
  const bg = color === 'green' ? '#059669' : color === 'red' ? '#dc2626' : color === 'orange' ? '#ea580c' : color === 'gray' ? '#94a3b8' : '#1e40af';
  return { ...S.bigBtn, backgroundColor: bg };
}
