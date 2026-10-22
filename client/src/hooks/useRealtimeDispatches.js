import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to stream live broadsheet dispatches and urgent gazette circulars via SSE (Task 102).
 */
export function useRealtimeDispatches() {
  const [notification, setNotification] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const dismissTimerRef = useRef(null);

  const clearNotification = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setNotification(null);
  }, []);

  const triggerNotification = useCallback(
    (notifData) => {
      clearNotification();
      setNotification(notifData);
      dismissTimerRef.current = setTimeout(() => {
        setNotification(null);
      }, 8000);
    },
    [clearNotification]
  );

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    const apiBase =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
      'http://localhost:5000/api';
    const streamUrl = `${apiBase.replace(/\/$/, '')}/realtime/stream`;

    let eventSource = null;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener('connected', () => {
        setIsConnected(true);
      });

      eventSource.addEventListener('dispatch:published', (e) => {
        try {
          const data = JSON.parse(e.data);
          triggerNotification({
            type: 'dispatch',
            badge: 'Breaking Gazette Dispatch',
            title: data.title || 'Fresh Gazette Dispatch Published',
            slug: data.slug,
            category: data.category || 'News',
            url: data.slug ? `/article/${data.slug}` : '/',
            timestamp: data.published_at || new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Failed to parse dispatch:published SSE event:', err);
        }
      });

      eventSource.addEventListener('circular:urgent', (e) => {
        try {
          const data = JSON.parse(e.data);
          triggerNotification({
            type: 'circular',
            badge: 'Urgent Gazette Circular',
            title: data.title || 'New Collegiate Circular Promulgated',
            reference_no: data.reference_no,
            department: data.department,
            url: '/circulars',
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Failed to parse circular:urgent SSE event:', err);
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        // EventSource will automatically attempt reconnection
      };
    } catch (err) {
      console.warn('Failed to initialize EventSource SSE connection:', err);
      setIsConnected(false);
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [triggerNotification]);

  return {
    notification,
    clearNotification,
    isConnected,
  };
}

export default useRealtimeDispatches;
