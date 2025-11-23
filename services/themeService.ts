
import { ThemePreferences } from '../types';

const THEME_KEY = 'greensync_theme';

const DEFAULT_THEME: ThemePreferences = {
  mode: 'light',
  primaryColor: '#2e7d32' // Default Green
};

export const themeService = {
  getPreferences: (): ThemePreferences => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_THEME;
  },

  savePreferences: (prefs: ThemePreferences) => {
    localStorage.setItem(THEME_KEY, JSON.stringify(prefs));
    themeService.applyTheme(prefs);
  },

  applyTheme: (prefs: ThemePreferences) => {
    // 1. Handle Dark Mode
    const html = document.documentElement;
    if (prefs.mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // 2. Handle Primary Color
    const root = document.documentElement;
    const { primaryColor } = prefs;
    
    // Set Main Color
    root.style.setProperty('--color-primary', primaryColor);
    
    // Calculate Hover (Darker)
    const hoverColor = adjustBrightness(primaryColor, -20);
    root.style.setProperty('--color-primary-hover', hoverColor);
    
    // Calculate Light/Bg (Lighter/Transparent)
    // Note: For simplicity in this env without a color library, 
    // we use a hex with opacity for the variable if possible, or a lighter mix
    root.style.setProperty('--color-primary-light', `${primaryColor}20`); // 20 = approx 12% opacity hex
  },

  init: () => {
    const prefs = themeService.getPreferences();
    themeService.applyTheme(prefs);
  }
};

// Helper to darken/lighten hex color
function adjustBrightness(col: string, amt: number) {
    let usePound = false;
    if (col[0] === "#") {
        col = col.slice(1);
        usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}
