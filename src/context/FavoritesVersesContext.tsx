import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getDataFromStorage, saveDataOnStorage } from "../helpers/storageData";

export type FavoriteBlockVerse = {
  verseNumber: string;
  text: string;
};

export type FavoriteBlock = {
  id: string;
  bookId: string;
  bookName: string;
  chapterName: string;
  verseNumbers: string[];
  verses: FavoriteBlockVerse[];
  comment?: string;
  savedAt: number;
};

export type FavoriteBlockInput = Omit<FavoriteBlock, "savedAt">;

const FAVORITES_STORAGE_FILE = "favorites-verses.json";

function isFavoriteBlockVerse(value: unknown): value is FavoriteBlockVerse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.verseNumber === "string" &&
    typeof candidate.text === "string"
  );
}

function isFavoriteBlock(value: unknown): value is FavoriteBlock {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.bookId === "string" &&
    typeof candidate.bookName === "string" &&
    typeof candidate.chapterName === "string" &&
    Array.isArray(candidate.verseNumbers) &&
    (candidate.verseNumbers as unknown[]).every((item) => typeof item === "string") &&
    Array.isArray(candidate.verses) &&
    (candidate.verses as unknown[]).every(isFavoriteBlockVerse) &&
    typeof candidate.savedAt === "number" &&
    (
      candidate.comment === undefined ||
      typeof candidate.comment === "string"
    )
  );
}

function parseStoredFavorites(value: unknown): FavoriteBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isFavoriteBlock);
}

type FavoritesVersesContextValue = {
  favorites: FavoriteBlock[];
  addFavorite: (entry: FavoriteBlockInput) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  getVerseFavorites: (
    bookId: string,
    chapterName: string,
    verseNumber: string
  ) => FavoriteBlock[];
};

const FavoritesVersesContext =
  createContext<FavoritesVersesContextValue | undefined>(undefined);

export function FavoritesVersesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [favorites, setFavorites] = useState<FavoriteBlock[]>([]);

  const hydrationRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const stored = await getDataFromStorage(FAVORITES_STORAGE_FILE);
      if (!isMounted) {
        return;
      }
      const parsed = parseStoredFavorites(stored);
      if (parsed.length > 0) {
        setFavorites(parsed);
      }
      hydrationRef.current = true;
    })().catch(() => {
      if (isMounted) {
        hydrationRef.current = true;
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrationRef.current) {
      return;
    }
    void saveDataOnStorage(
      FAVORITES_STORAGE_FILE,
      JSON.stringify(favorites)
    );
  }, [favorites]);

  const addFavorite = useCallback((entry: FavoriteBlockInput) => {
    setFavorites((prev) => [{ ...entry, savedAt: Date.now() }, ...prev]);
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const verseLookup = useMemo(() => {
    const map = new Map<string, FavoriteBlock[]>();
    favorites.forEach((block) => {
      block.verseNumbers.forEach((verseNumber) => {
        const key = `${block.bookId}-${block.chapterName}-${verseNumber}`;
        const list = map.get(key);
        if (list) {
          list.push(block);
        } else {
          map.set(key, [block]);
        }
      });
    });
    return map;
  }, [favorites]);

  const getVerseFavorites = useCallback(
    (bookId: string, chapterName: string, verseNumber: string) =>
      verseLookup.get(`${bookId}-${chapterName}-${verseNumber}`) ?? [],
    [verseLookup]
  );

  const value = useMemo(
    () => ({
      favorites,
      addFavorite,
      removeFavorite,
      clearFavorites,
      getVerseFavorites,
    }),
    [addFavorite, clearFavorites, favorites, getVerseFavorites, removeFavorite]
  );

  return (
    <FavoritesVersesContext.Provider value={value}>
      {children}
    </FavoritesVersesContext.Provider>
  );
}

export function useFavoritesVerses() {
  const context = useContext(FavoritesVersesContext);
  if (!context) {
    throw new Error(
      "useFavoritesVerses debe usarse dentro de un FavoritesVersesProvider"
    );
  }
  return context;
}
