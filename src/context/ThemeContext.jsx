import { useState, useMemo, useEffect } from 'react';
import { THEMES, THEME_LIST, DEFAULT_THEME_ID } from '../utils/themes';
import { ThemeContext } from './ThemeContextCore';
import { contrastFg, makeSx } from '../utils/themeStyles';

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    const stored = localStorage.getItem('dupla_theme') || DEFAULT_THEME_ID;
    // migrate legacy theme id
    return (stored === 'airbnb' || !THEMES[stored]) ? DEFAULT_THEME_ID : stored;
  });
  const [fontScale, setFontScale] = useState(
    () => parseFloat(localStorage.getItem('dupla_fontscale') || '1')
  );

  const C  = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const Sx = useMemo(() => makeSx(C), [C]);

  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.color      = C.gray1;
    localStorage.setItem('dupla_theme', themeId);
  }, [themeId, C]);

  useEffect(() => {
    localStorage.setItem('dupla_fontscale', String(fontScale));
  }, [fontScale]);

  const value = { C, Sx, themeId, setThemeId, THEME_LIST, fontScale, setFontScale, contrastFg };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
