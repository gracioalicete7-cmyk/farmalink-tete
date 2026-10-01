/**
 * Theme Management Service for FarmaLink Tete
 * Supports Light, Dark, and System modes with Tailwind CSS
 */

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'farmalink_theme_mode';

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (err) {
    console.warn('Error reading theme from storage:', err);
  }
  return 'light';
};

export const getEffectiveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return mode;
};

export const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (err) {
    console.warn('Error saving theme to storage:', err);
  }

  const effective = getEffectiveTheme(mode);
  const root = document.documentElement;

  if (effective === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // Dispatch event for components listening to theme changes
  window.dispatchEvent(new CustomEvent('farmalink_theme_changed', { detail: { mode, effective } }));
};

export const initTheme = () => {
  if (typeof window === 'undefined') return;

  const currentMode = getStoredTheme();
  applyTheme(currentMode);

  // Listen to system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemChange = () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemChange);
  } else {
    mediaQuery.addListener(handleSystemChange);
  }
};
