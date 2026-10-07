import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import articleService from '../services/articleService';

const STORAGE_KEY = 'mcc_reading_list';
const EVENT_NAME = 'mcc:reading-list-updated';

function getStoredBookmarks() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse bookmarks from storage:', err);
    return [];
  }
}

export function useReadingList() {
  const [bookmarks, setBookmarks] = useState(getStoredBookmarks);
  const [isSyncing, setIsSyncing] = useState(false);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const isAuthenticated = Boolean(user && user.id);
  const syncedRef = useRef(false);

  // Sync state when local event or cross-tab storage changes
  useEffect(() => {
    const handleUpdate = () => {
      setBookmarks(getStoredBookmarks());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const saveBookmarks = useCallback((newList) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      setBookmarks(newList);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (err) {
      console.error('Failed to save bookmarks:', err);
    }
  }, []);

  // Task 97: Synchronize bookmarks with cloud when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = false;
      return;
    }

    let isMounted = true;

    async function syncCloudBookmarks() {
      try {
        setIsSyncing(true);
        const res = await articleService.getUserBookmarks();
        if (!isMounted) return;

        if (res && res.success && Array.isArray(res.data)) {
          const cloudBookmarks = res.data.map((b) => ({
            id: b.id,
            slug: b.slug || String(b.id),
            title: b.title || 'Untitled Dispatch',
            summary: b.summary || '',
            cover_image: b.cover_image || '',
            category_name: b.category_name || 'Gazette',
            reading_time: '4 min read',
            saved_at: b.bookmarked_at || new Date().toISOString(),
          }));

          const local = getStoredBookmarks();
          // Merge local bookmarks that might have been saved before login
          const merged = [...cloudBookmarks];
          for (const localItem of local) {
            const exists = merged.some(
              (m) => String(m.id) === String(localItem.id) || String(m.slug) === String(localItem.slug)
            );
            if (!exists) {
              merged.push(localItem);
              // Push local item to cloud
              if (localItem.id && !isNaN(Number(localItem.id))) {
                articleService.toggleCloudBookmark(localItem.id).catch(() => {});
              }
            }
          }

          saveBookmarks(merged);
          syncedRef.current = true;
        }
      } catch (err) {
        console.warn('Cloud bookmarks sync fallback to localStorage:', err.message);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    syncCloudBookmarks();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, saveBookmarks]);

  const addBookmark = useCallback(
    async (article) => {
      if (!article) return;
      const current = getStoredBookmarks();
      const identifier = article.id || article.slug;
      const exists = current.some(
        (b) => String(b.id || b.slug) === String(identifier)
      );

      if (!exists) {
        const item = {
          id: article.id || article.slug,
          slug: article.slug || String(article.id),
          title: article.title || 'Untitled Dispatch',
          summary: article.summary || article.excerpt || '',
          cover_image: article.cover_image || article.featured_image || '',
          category_name: article.category_name || article.category || 'Gazette',
          reading_time: article.reading_time || '4 min read',
          saved_at: new Date().toISOString(),
        };
        const updated = [item, ...current];
        saveBookmarks(updated);

        // Sync with cloud if authenticated
        if (isAuthenticated && article.id && !isNaN(Number(article.id))) {
          try {
            await articleService.toggleCloudBookmark(article.id);
          } catch (e) {
            console.warn('Failed to sync bookmark addition to cloud:', e.message);
          }
        }
      }
    },
    [isAuthenticated, saveBookmarks]
  );

  const removeBookmark = useCallback(
    async (articleId) => {
      if (!articleId) return;
      const current = getStoredBookmarks();
      const updated = current.filter(
        (b) => String(b.id) !== String(articleId) && String(b.slug) !== String(articleId)
      );
      saveBookmarks(updated);

      // Sync removal with cloud if authenticated
      if (isAuthenticated && !isNaN(Number(articleId))) {
        try {
          await articleService.toggleCloudBookmark(articleId);
        } catch (e) {
          console.warn('Failed to sync bookmark removal with cloud:', e.message);
        }
      }
    },
    [isAuthenticated, saveBookmarks]
  );

  const isBookmarked = useCallback(
    (articleId) => {
      if (!articleId) return false;
      return bookmarks.some(
        (b) => String(b.id) === String(articleId) || String(b.slug) === String(articleId)
      );
    },
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (article) => {
      if (!article) return;
      const articleId = article.id || article.slug;
      if (isBookmarked(articleId)) {
        await removeBookmark(articleId);
      } else {
        await addBookmark(article);
      }
    },
    [isBookmarked, removeBookmark, addBookmark]
  );

  const clearBookmarks = useCallback(() => {
    saveBookmarks([]);
  }, [saveBookmarks]);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearBookmarks,
    isSyncing,
    count: bookmarks.length,
  };
}

export default useReadingList;
