import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import articleService from '../services/articleService';

export const PageSettingsContext = createContext(null);

export const DEFAULT_PAGE_SETTINGS = {
  header_brand_title: 'Madras Christian College',
  header_brand_subtitle: 'CAMPUS NEWS PORTAL',
  header_edition_text: 'Autonomous Institution • Affiliated to University of Madras • NAAC A++',
  header_date_mode: 'live',

  ticker_enabled: true,
  ticker_speed_ms: 4500,
  ticker_items: [
    {
      id: 't-1',
      text: 'OFFICIAL GAZETTE: Madras Christian College (Autonomous) — Institutional Circulars & Notices Desk.',
      link: '/circulars',
      category: 'Gazette',
    },
    {
      id: 't-2',
      text: 'ACADEMIC REGISTRY: Official collegiate notices published across all 38 department bureaus.',
      link: '/departments',
      category: 'Academic',
    },
    {
      id: 't-3',
      text: 'TAMBARAM SANCTUARY: Research & scientific inquiry across the 365-acre scrub jungle campus.',
      link: '/gallery',
      category: 'Sanctuary',
    },
  ],

  slideshow_speed_ms: 4500,
  slideshow_mode: 'auto',
  slideshow_custom_slides: [],

  curated_lead_article_id: '',
  curated_secondary_article_ids: [],

  footer_description:
    'An autonomous liberal arts and sciences institution affiliated with the University of Madras. Dedicated to academic excellence, investigative student journalism, and scientific inquiry in the 365-acre scrub jungle sanctuary.',
  footer_accreditation: 'Autonomous Institution • NAAC A++ Grade',
  footer_motto: 'Motto: "Lighted to Lighten" • Est. 1837',
  footer_address: 'Madras Christian College, Tambaram East, Chennai - 600059, Tamil Nadu, India',
  footer_phone: '+91 44 2239 0675',
  footer_email: 'principal@mcc.edu.in',
  footer_college_url: 'https://mcc.edu.in',
  footer_college_label: 'College Official Portal (mcc.edu.in)',
  footer_copyright: 'Madras Christian College. All rights reserved. Official Campus News Portal.',
};

/**
 * Normalizes raw key-value pairs into typed object.
 */
function normalizeSettings(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_PAGE_SETTINGS;

  const result = { ...DEFAULT_PAGE_SETTINGS };

  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null) continue;

    // Parse booleans
    if (k === 'ticker_enabled') {
      result[k] = v === 'true' || v === true;
      continue;
    }

    // Parse numbers
    if (k === 'ticker_speed_ms' || k === 'slideshow_speed_ms') {
      result[k] = Number(v) || 4500;
      continue;
    }

    // Parse JSON arrays/objects if returned as string
    if (k === 'ticker_items' || k === 'slideshow_custom_slides' || k === 'curated_secondary_article_ids') {
      if (typeof v === 'string') {
        try {
          result[k] = JSON.parse(v);
        } catch {
          result[k] = result[k] || [];
        }
      } else if (Array.isArray(v)) {
        result[k] = v;
      }
      continue;
    }

    result[k] = v;
  }

  return result;
}

export function PageSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_PAGE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await articleService.getPageSettings();
      if (res && res.settings) {
        setSettings(normalizeSettings(res.settings));
      }
    } catch (err) {
      console.warn('Failed to fetch public page settings, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettingsBulk = useCallback(
    async (newSettings) => {
      // Optimistic update
      setSettings((prev) => ({
        ...prev,
        ...normalizeSettings(newSettings),
      }));

      // Remote update
      const res = await articleService.updatePageSettingsBulk(newSettings);
      if (res && res.settings) {
        setSettings((prev) => ({
          ...prev,
          ...normalizeSettings(res.settings),
        }));
      }
      return res;
    },
    []
  );

  const value = {
    settings,
    loading,
    refreshSettings: fetchSettings,
    updateSettingsBulk,
  };

  return (
    <PageSettingsContext.Provider value={value}>
      {children}
    </PageSettingsContext.Provider>
  );
}

export function usePageSettings() {
  const ctx = useContext(PageSettingsContext);
  if (!ctx) {
    return {
      settings: DEFAULT_PAGE_SETTINGS,
      loading: false,
      refreshSettings: () => {},
      updateSettingsBulk: async () => {},
    };
  }
  return ctx;
}
