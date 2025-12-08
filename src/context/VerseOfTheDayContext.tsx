import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Share from 'react-native-share';
import { Alert } from 'react-native';
import { getDataFromStorage, saveDataOnStorage } from '../helpers/storageData';
import { getTodayDateString } from '../types/streak';

const STORAGE_FILE = 'verse-of-day-list.json';
const ADMIN_CODE_FILE = 'admin-code.json';
const DEFAULT_ADMIN_CODE = '1234'; // Código por defecto

export type CuratedVerse = {
  bookName: string;
  bookIndex: number;
  testamentName: string;
  chapterName: string;
  chapterIndex: number;
  verseName: string;
  verseText: string;
  bookId: string;
  dateAdded?: string; // Para referencia
};

type VerseOfTheDayContextType = {
  curatedVerses: CuratedVerse[];
  isAdmin: boolean;
  adminCode: string;
  setAdminCode: (code: string) => Promise<void>;
  checkAdminCode: (code: string) => Promise<boolean>;
  addVerseToCuratedList: (verse: CuratedVerse) => Promise<void>;
  removeVerseFromCuratedList: (index: number) => Promise<void>;
  exportCuratedList: () => Promise<void>;
  importCuratedList: (jsonString: string) => Promise<void>;
  clearCuratedList: () => Promise<void>;
  getCuratedVerseForDate: (date: Date) => CuratedVerse | null;
};

const VerseOfTheDayContext = createContext<VerseOfTheDayContextType | undefined>(undefined);

export const VerseOfTheDayProvider = ({ children }: { children: ReactNode }) => {
  const [curatedVerses, setCuratedVerses] = useState<CuratedVerse[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCodeState] = useState(DEFAULT_ADMIN_CODE);

  // Cargar lista curada y código admin al iniciar
  useEffect(() => {
    loadCuratedList();
    loadAdminCode();
  }, []);

  const loadCuratedList = async () => {
    try {
      const data = await getDataFromStorage(STORAGE_FILE);
      if (data && Array.isArray(data)) {
        setCuratedVerses(data);
      }
    } catch (e) {
      console.error('Error loading curated list:', e);
    }
  };

  const loadAdminCode = async () => {
    try {
      const data = await getDataFromStorage(ADMIN_CODE_FILE);
      if (data && typeof data.code === 'string') {
        setAdminCodeState(data.code);
      }
    } catch (e) {
      console.error('Error loading admin code:', e);
    }
  };

  const saveCuratedList = async (verses: CuratedVerse[]) => {
    try {
      await saveDataOnStorage(STORAGE_FILE, JSON.stringify(verses));
      setCuratedVerses(verses);
    } catch (e) {
      console.error('Error saving curated list:', e);
    }
  };

  const setAdminCode = async (code: string) => {
    try {
      await saveDataOnStorage(ADMIN_CODE_FILE, JSON.stringify({ code }));
      setAdminCodeState(code);
    } catch (e) {
      console.error('Error saving admin code:', e);
    }
  };

  const checkAdminCode = async (code: string): Promise<boolean> => {
    const isValid = code === adminCode;
    setIsAdmin(isValid);
    return isValid;
  };

  const addVerseToCuratedList = async (verse: CuratedVerse) => {
    try {
      // Verificar si ya existe
      const exists = curatedVerses.some(
        v => v.bookId === verse.bookId &&
             v.chapterName === verse.chapterName &&
             v.verseName === verse.verseName
      );

      if (exists) {
        Alert.alert('Versículo duplicado', 'Este versículo ya está en la lista curada.');
        return;
      }

      const newVerse = {
        ...verse,
        dateAdded: new Date().toISOString(),
      };

      const updatedVerses = [...curatedVerses, newVerse];
      await saveCuratedList(updatedVerses);

      Alert.alert(
        'Versículo agregado',
        `Total de versículos curados: ${updatedVerses.length}`
      );
    } catch (e) {
      console.error('Error adding verse:', e);
      Alert.alert('Error', 'No se pudo agregar el versículo');
    }
  };

  const removeVerseFromCuratedList = async (index: number) => {
    try {
      const updatedVerses = curatedVerses.filter((_, i) => i !== index);
      await saveCuratedList(updatedVerses);
      Alert.alert('Versículo eliminado', `Quedan ${updatedVerses.length} versículos`);
    } catch (e) {
      console.error('Error removing verse:', e);
      Alert.alert('Error', 'No se pudo eliminar el versículo');
    }
  };

  const exportCuratedList = async () => {
    try {
      if (curatedVerses.length === 0) {
        Alert.alert('Lista vacía', 'No hay versículos para exportar');
        return;
      }

      const jsonString = JSON.stringify(curatedVerses, null, 2);
      const fileName = `versiculos_del_dia_${getTodayDateString()}.json`;

      await Share.open({
        title: 'Exportar Lista de Versículos',
        message: jsonString,
        filename: fileName,
        type: 'application/json',
      });

      Alert.alert(
        'Lista exportada',
        `Se exportaron ${curatedVerses.length} versículos`
      );
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Error exporting list:', error);
        Alert.alert('Error', 'No se pudo exportar la lista');
      }
    }
  };

  const importCuratedList = async (jsonString: string) => {
    try {
      const verses = JSON.parse(jsonString);

      if (!Array.isArray(verses)) {
        throw new Error('Formato inválido: debe ser un array');
      }

      // Validar estructura básica
      const isValid = verses.every(v =>
        v.bookName && v.chapterName && v.verseName && v.verseText
      );

      if (!isValid) {
        throw new Error('Formato inválido: faltan campos requeridos');
      }

      await saveCuratedList(verses);

      Alert.alert(
        'Lista importada',
        `Se importaron ${verses.length} versículos exitosamente`
      );
    } catch (e: any) {
      console.error('Error importing list:', e);
      Alert.alert('Error', `No se pudo importar: ${e.message}`);
    }
  };

  const clearCuratedList = async () => {
    try {
      await saveCuratedList([]);
      Alert.alert('Lista limpiada', 'Se eliminaron todos los versículos');
    } catch (e) {
      console.error('Error clearing list:', e);
      Alert.alert('Error', 'No se pudo limpiar la lista');
    }
  };

  const getCuratedVerseForDate = (date: Date): CuratedVerse | null => {
    if (curatedVerses.length === 0) return null;

    // Usar el mismo algoritmo de hash que antes
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
      hash = hash & hash;
    }
    hash = Math.abs(hash);

    const verseIndex = hash % curatedVerses.length;
    return curatedVerses[verseIndex];
  };

  return (
    <VerseOfTheDayContext.Provider
      value={{
        curatedVerses,
        isAdmin,
        adminCode,
        setAdminCode,
        checkAdminCode,
        addVerseToCuratedList,
        removeVerseFromCuratedList,
        exportCuratedList,
        importCuratedList,
        clearCuratedList,
        getCuratedVerseForDate,
      }}
    >
      {children}
    </VerseOfTheDayContext.Provider>
  );
};

export const useVerseOfTheDay = () => {
  const context = useContext(VerseOfTheDayContext);
  if (context === undefined) {
    throw new Error('useVerseOfTheDay must be used within VerseOfTheDayProvider');
  }
  return context;
};
