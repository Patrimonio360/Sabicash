import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sabicash_v2';

const defaultState = {
  // Perfil
  name: '', avatar: '😊', course: '', setupDone: false,
  // Segundo idioma (frances, aleman, portugues, italiano, chino)
  secondLanguage: 'frances',
  // Paga
  balance: 0, allowance: 0, monthSpent: 0,
  recoveryLevel: 0, month: 1, pagoStarted: false,
  lastPaymentMonth: null,
  // Puntos
  totalPoints: 0, availablePoints: 0,
  // Racha
  lastPlayDate: null, streak: 0,
  // Estadisticas por asignatura
  subjectStats: {},
  // Juego diario — una ronda por asignatura al dia
  dailyPlays: { date: null, played: [] },
  // Historial
  history: [], gameHistory: [],
  // Padre
  parentPin: '1234', parentSetup: false,
  parentAlerts: [], unreadAlerts: 0,
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  function update(patch) {
    setState(prev => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }

  function reset() {
    const fresh = { ...defaultState };
    AsyncStorage.setItem(KEY, JSON.stringify(fresh)).catch(() => {});
    setState(fresh);
  }

  return (
    <AppContext.Provider value={{ state, update, reset, loaded }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
