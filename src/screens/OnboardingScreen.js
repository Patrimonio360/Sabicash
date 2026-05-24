import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { COURSES } from '../data/questions';

const AVATARS = ['😊','😎','🤓','🦸','🧑‍🚀','🧙','🦊','🐼','🐯','🦁','🐸','🐧'];

export default function OnboardingScreen() {
  const { update } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('😊');
  const [course, setCourse] = useState('');

  function finish() {
    if (!name.trim()) return Alert.alert('¡Pon tu nombre!', 'Necesito saber cómo llamarte 😊');
    if (!course) return Alert.alert('Elige tu curso', 'Selecciona en qué curso estás.');
    update({ name: name.trim(), avatar, course, setupDone: true });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>

        {step === 0 && (
          <View style={styles.step}>
            <Text style={styles.emoji}>💰</Text>
            <Text style={styles.title}>Bienvenido a{'\n'}SabiCash</Text>
            <Text style={styles.sub}>Estudia, gana puntos y conviértelos en dinero real. ¡Tu paga depende de ti!</Text>
            <TouchableOpacity style={styles.btn} onPress={() => setStep(1)}>
              <Text style={styles.btnTxt}>¡Empezar! →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.emoji}>✏️</Text>
            <Text style={styles.title}>¿Cómo te llamas?</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre..."
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={20}
            />
            <Text style={styles.title2}>Elige tu avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.avatarBtn, avatar === a && styles.avatarBtnActive]}
                  onPress={() => setAvatar(a)}
                >
                  <Text style={styles.avatarEmoji}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => name.trim() ? setStep(2) : Alert.alert('¡Pon tu nombre!')}>
              <Text style={styles.btnTxt}>Siguiente →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.emoji}>{avatar}</Text>
            <Text style={styles.title}>¡Hola, {name}!{'\n'}¿En qué curso estás?</Text>
            {COURSES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.courseBtn, course === c.id && styles.courseBtnActive]}
                onPress={() => setCourse(c.id)}
              >
                <Text style={styles.courseEmoji}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courseLabel, course === c.id && { color: '#fff' }]}>{c.label}</Text>
                  <Text style={[styles.courseAge, course === c.id && { color: '#c7d2fe' }]}>{c.age}</Text>
                </View>
                {course === c.id && <Text style={{ color: '#fff', fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.btn, { marginTop: 8 }]} onPress={finish}>
              <Text style={styles.btnTxt}>¡Comenzar! 🚀</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#0f172a' },
  content:     { padding: 24, paddingBottom: 40 },
  step:        { alignItems: 'center' },
  emoji:       { fontSize: 72, marginTop: 20, marginBottom: 16 },
  title:       { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 12, lineHeight: 36 },
  title2:      { fontSize: 18, fontWeight: '800', color: '#c7d2fe', marginTop: 20, marginBottom: 12, alignSelf: 'flex-start' },
  sub:         { fontSize: 16, color: '#94a3b8', textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 8 },
  btn:         { backgroundColor: '#1e40af', padding: 16, borderRadius: 16, width: '100%', alignItems: 'center', marginTop: 16 },
  btnTxt:      { color: '#fff', fontWeight: '900', fontSize: 17 },
  input:       { borderWidth: 2, borderColor: '#334155', borderRadius: 14, padding: 16, fontSize: 20, fontWeight: '700', color: '#fff', width: '100%', marginBottom: 8, backgroundColor: '#1e293b' },
  avatarGrid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 8, width: '100%' },
  avatarBtn:   { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#334155' },
  avatarBtnActive: { borderColor: '#3b82f6', backgroundColor: '#1e3a8a' },
  avatarEmoji: { fontSize: 30 },
  courseBtn:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8, width: '100%', borderWidth: 2, borderColor: '#334155', gap: 12 },
  courseBtnActive: { backgroundColor: '#1e40af', borderColor: '#3b82f6' },
  courseEmoji: { fontSize: 24 },
  courseLabel: { fontWeight: '800', fontSize: 15, color: '#e2e8f0' },
  courseAge:   { fontSize: 12, color: '#64748b', marginTop: 2 },
});
