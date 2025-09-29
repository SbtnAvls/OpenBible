import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

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
