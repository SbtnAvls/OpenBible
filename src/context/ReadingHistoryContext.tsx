import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { getDataFromStorage, saveDataOnStorage } from '../helpers/storageData';

interface ReadingEntry {
  book: string;
  chapter: number;
  timestamp: number;
  type: 'flashView' | 'recentRead';
  pinned?: boolean;
}

interface ReadingHistoryContextType {
  flashViews: ReadingEntry[];
  recentReads: ReadingEntry[];
  addFlashView: (book: string, chapter: number) => void;
  convertToRecentRead: (book: string, chapter: number) => void;
  removeFlashView: (book: string, chapter: number) => void;
  togglePin: (book: string, chapter: number) => void;
  updatePinnedChapter: (
    oldBook: string,
    oldChapter: number,
    newBook: string,
    newChapter: number,
  ) => void;
  unpinChapter: (book: string, chapter: number) => void;
  hasSeenPinExplanation: boolean;
  markPinExplanationAsSeen: () => void;
}

const ReadingHistoryContext = createContext<
  ReadingHistoryContextType | undefined
>(undefined);

const STORAGE_FILE = 'reading_history.json';
const PIN_EXPLANATION_SEEN_KEY = 'pin_explanation_seen';
const MAX_TOTAL_ENTRIES = 36;

export const ReadingHistoryProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [flashViews, setFlashViews] = useState<ReadingEntry[]>([]);
  const [recentReads, setRecentReads] = useState<ReadingEntry[]>([]);
  const [hasSeenPinExplanation, setHasSeenPinExplanation] = useState(true); // Empezar como true para evitar flash

  useEffect(() => {
    loadHistory();
    loadPinExplanationSeen();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await getDataFromStorage(STORAGE_FILE);
      if (history) {
        setFlashViews(history.flashViews || []);
        setRecentReads(history.recentReads || []);
      }
    } catch (error) {
      console.error('Error loading reading history:', error);
    }
  };

  const saveHistory = async (flash: ReadingEntry[], recent: ReadingEntry[]) => {
    try {
      const data = JSON.stringify({
        flashViews: flash,
        recentReads: recent,
      });
      await saveDataOnStorage(STORAGE_FILE, data);
    } catch (error) {
      console.error('Error saving reading history:', error);
    }
  };

  const loadPinExplanationSeen = async () => {
    try {
      const seen = await getDataFromStorage(PIN_EXPLANATION_SEEN_KEY);
      setHasSeenPinExplanation(seen === 'true');
    } catch (error) {
      console.error('Error loading pin explanation seen:', error);
      setHasSeenPinExplanation(false);
    }
  };

  const markPinExplanationAsSeen = async () => {
    try {
      await saveDataOnStorage(PIN_EXPLANATION_SEEN_KEY, 'true');
      setHasSeenPinExplanation(true);
    } catch (error) {
      console.error('Error marking pin explanation as seen:', error);
    }
  };

  const maintainLimit = (
    flash: ReadingEntry[],
    recent: ReadingEntry[],
  ): [ReadingEntry[], ReadingEntry[]] => {
    // Separar entradas ancladas (solo pueden ser recentReads)
    const pinnedEntries = recent.filter(e => e.pinned);
    const unpinnedRecent = recent.filter(e => !e.pinned);

    // Combinar flashViews con recentReads no ancladas
    const unpinnedEntries = [...flash, ...unpinnedRecent];
    const totalUnpinned = unpinnedEntries.length;
    const pinnedCount = pinnedEntries.length;
    const maxUnpinned = MAX_TOTAL_ENTRIES - pinnedCount;

    if (totalUnpinned <= maxUnpinned) {
      return [flash, recent];
    }

    // Ordenar no ancladas por timestamp (más antiguas primero para eliminarlas)
    const sortedUnpinned = unpinnedEntries.sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    const entriesToRemove = totalUnpinned - maxUnpinned;
    const remainingUnpinned = sortedUnpinned.slice(entriesToRemove);

    const newFlash = remainingUnpinned.filter(e => e.type === 'flashView');
    const newUnpinnedRecent = remainingUnpinned.filter(
      e => e.type === 'recentRead',
    );

    // Combinar ancladas con no ancladas
    const newRecent = [...pinnedEntries, ...newUnpinnedRecent];

    return [newFlash, newRecent];
  };

  const addFlashView = useCallback((book: string, chapter: number) => {
    setRecentReads(currentRecent => {
      setFlashViews(currentFlash => {
        const existingFlashIndex = currentFlash.findIndex(
          entry => entry.book === book && entry.chapter === chapter,
        );
        const existingRecentIndex = currentRecent.findIndex(
          entry => entry.book === book && entry.chapter === chapter,
        );

        // Si ya está en recentReads, no hacer nada (tiene prioridad)
        if (existingRecentIndex !== -1) {
          return currentFlash;
        }

        let newFlash: ReadingEntry[];
        let newRecent = [...currentRecent];

        // Si ya existe en flashViews, actualizar timestamp y moverlo al final (más reciente)
        if (existingFlashIndex !== -1) {
          // Remover la entrada antigua
          newFlash = currentFlash.filter(
            entry => !(entry.book === book && entry.chapter === chapter),
          );
          // Agregar la entrada actualizada con nuevo timestamp
          const updatedEntry: ReadingEntry = {
            book,
            chapter,
            timestamp: Date.now(),
            type: 'flashView',
          };
          newFlash = [...newFlash, updatedEntry];
        } else {
          // Si no existe, crear nueva entrada
          const newEntry: ReadingEntry = {
            book,
            chapter,
            timestamp: Date.now(),
            type: 'flashView',
          };
          newFlash = [...currentFlash, newEntry];
        }

        [newFlash, newRecent] = maintainLimit(newFlash, newRecent);
        saveHistory(newFlash, newRecent);

        return newFlash;
      });
      return currentRecent;
    });
  }, []);

  const removeFlashView = useCallback((book: string, chapter: number) => {
    setRecentReads(currentRecent => {
      setFlashViews(currentFlash => {
        const newFlash = currentFlash.filter(
          entry => !(entry.book === book && entry.chapter === chapter),
        );
        saveHistory(newFlash, currentRecent);
        return newFlash;
      });
      return currentRecent;
    });
  }, []);

  const convertToRecentRead = useCallback((book: string, chapter: number) => {
    setFlashViews(currentFlash => {
      setRecentReads(currentRecent => {
        const flashIndex = currentFlash.findIndex(
          entry => entry.book === book && entry.chapter === chapter,
        );

        let newFlash = [...currentFlash];
        let newRecent = [...currentRecent];

        if (flashIndex !== -1) {
          newFlash = currentFlash.filter(
            entry => !(entry.book === book && entry.chapter === chapter),
          );
        }

        const existingRecentIndex = newRecent.findIndex(
          entry => entry.book === book && entry.chapter === chapter,
        );

        if (existingRecentIndex !== -1) {
          newRecent.splice(existingRecentIndex, 1);
        }

        const newEntry: ReadingEntry = {
          book,
          chapter,
          timestamp: Date.now(),
          type: 'recentRead',
        };

        newRecent = [newEntry, ...newRecent];
        [newFlash, newRecent] = maintainLimit(newFlash, newRecent);

        saveHistory(newFlash, newRecent);
        return newRecent;
      });

      const flashIndex = currentFlash.findIndex(
        entry => entry.book === book && entry.chapter === chapter,
      );

      if (flashIndex !== -1) {
        return currentFlash.filter(
          entry => !(entry.book === book && entry.chapter === chapter),
        );
      }

      return currentFlash;
    });
  }, []);

  const togglePin = useCallback((book: string, chapter: number) => {
    setFlashViews(currentFlash => {
      setRecentReads(currentRecent => {
        const entryIndex = currentRecent.findIndex(
          entry => entry.book === book && entry.chapter === chapter,
        );

        if (entryIndex === -1) {
          return currentRecent; // Solo se pueden anclar recentReads
        }

        const entry = currentRecent[entryIndex];
        const currentlyPinned = currentRecent.filter(e => e.pinned).length;

        // Si no está anclada y ya hay 3 ancladas, no permitir
        if (!entry.pinned && currentlyPinned >= 3) {
          return currentRecent;
        }

        const newRecent = currentRecent.map(e => {
          if (e.book === book && e.chapter === chapter) {
            return { ...e, pinned: !e.pinned };
          }
          return e;
        });

        saveHistory(currentFlash, newRecent);
        return newRecent;
      });
      return currentFlash;
    });
  }, []);

  const updatePinnedChapter = useCallback(
    (
      oldBook: string,
      oldChapter: number,
      newBook: string,
      newChapter: number,
    ) => {
      setFlashViews(currentFlash => {
        setRecentReads(currentRecent => {
          // Buscar el capítulo anterior anclado
          const oldEntryIndex = currentRecent.findIndex(
            entry =>
              entry.book === oldBook &&
              entry.chapter === oldChapter &&
              entry.pinned,
          );

          // Si no está anclado, no hacer nada
          if (oldEntryIndex === -1) {
            return currentRecent;
          }

          // Eliminar el capítulo anterior completamente
          let newRecent = currentRecent.filter(
            e => !(e.book === oldBook && e.chapter === oldChapter),
          );

          // Buscar si el nuevo capítulo ya existe en recentReads
          const newEntryIndex = newRecent.findIndex(
            entry => entry.book === newBook && entry.chapter === newChapter,
          );

          if (newEntryIndex !== -1) {
            // Si existe, solo anclarlo
            newRecent = newRecent.map(e => {
              if (e.book === newBook && e.chapter === newChapter) {
                return { ...e, pinned: true, timestamp: Date.now() };
              }
              return e;
            });
          } else {
            // Si no existe, crear nueva entrada anclada
            const newEntry: ReadingEntry = {
              book: newBook,
              chapter: newChapter,
              timestamp: Date.now(),
              type: 'recentRead',
              pinned: true,
            };
            newRecent = [newEntry, ...newRecent];
          }

          saveHistory(currentFlash, newRecent);
          return newRecent;
        });
        return currentFlash;
      });
    },
    [],
  );

  const unpinChapter = useCallback((book: string, chapter: number) => {
    setFlashViews(currentFlash => {
      setRecentReads(currentRecent => {
        const newRecent = currentRecent.map(e => {
          if (e.book === book && e.chapter === chapter) {
            return { ...e, pinned: false };
          }
          return e;
        });

        saveHistory(currentFlash, newRecent);
        return newRecent;
      });
      return currentFlash;
    });
  }, []);

  return (
    <ReadingHistoryContext.Provider
      value={{
        flashViews,
        recentReads,
        addFlashView,
        convertToRecentRead,
        removeFlashView,
        togglePin,
        updatePinnedChapter,
        unpinChapter,
        hasSeenPinExplanation,
        markPinExplanationAsSeen,
      }}
    >
      {children}
    </ReadingHistoryContext.Provider>
  );
};

export const useReadingHistory = () => {
  const context = useContext(ReadingHistoryContext);
  if (!context) {
    throw new Error(
      'useReadingHistory must be used within ReadingHistoryProvider',
    );
  }
  return context;
};
