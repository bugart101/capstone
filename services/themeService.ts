
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
    // We use a blend logic to ensure it looks good on both light and dark backgrounds
    const lightColor = prefs.mode === 'light' 
      ? mixColors(primaryColor, '#ffffff', 0.88) // Light mode: 88% white (very pale)
      : mixColors(primaryColor, '#1f2937', 0.3); // Dark mode: 30% dark gray (visible but muted)
      
    root.style.setProperty('--color-primary-light', lightColor); 
  },

  init: () => {
    const prefs = themeService.getPreferences();
    themeService.applyTheme(prefs);
  }
};

// Helper to blend two colors
function mixColors(color1: string, color2: string, weight: number): string {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 * (1 - weight) + r2 * weight);
  const g = Math.round(g1 * (1 - weight) + g2 * weight);
  const b = Math.round(b1 * (1 - weight) + b2 * weight);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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
    
    let g = ((num >> 8) & 0x00FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    
    let b = (num & 0x0000FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return (usePound ? "#" : "") + toHex(r) + toHex(g) + toHex(b);
}
