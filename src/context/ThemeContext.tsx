import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type AccentColor = 'indigo' | 'blue' | 'purple' | 'pink' | 'emerald' | 'orange';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('ai-tutor-theme');
    return (saved as Theme) || 'light';
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('ai-tutor-accent-color');
    return (saved as AccentColor) || 'indigo';
  });

  const [isDark, setIsDark] = useState(false);

  // Handle theme changes
  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = false;

      if (theme === 'dark') {
        shouldBeDark = true;
      } else if (theme === 'auto') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(shouldBeDark);

      // Apply theme to document root and body
      const root = document.documentElement;
      const body = document.body;
      
      if (shouldBeDark) {
        root.classList.add('dark');
        body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
      }

      // Apply accent color CSS variables
      const colorMap = {
        indigo: { primary: '99 102 241', secondary: '129 140 248' },
        blue: { primary: '59 130 246', secondary: '96 165 250' },
        purple: { primary: '147 51 234', secondary: '168 85 247' },
        pink: { primary: '236 72 153', secondary: '244 114 182' },
        emerald: { primary: '16 185 129', secondary: '52 211 153' },
        orange: { primary: '249 115 22', secondary: '251 146 60' }
      };

      const colors = colorMap[accentColor];
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-primary-light', colors.secondary);

      // Force a repaint to ensure changes are applied immediately
      void root.offsetHeight; // Trigger reflow
    };

    updateTheme();

    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, accentColor]);

  // Apply initial theme on mount
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Determine initial theme
    let shouldBeDark = false;
    if (theme === 'dark') {
      shouldBeDark = true;
    } else if (theme === 'auto') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(shouldBeDark);
    
    // Apply theme classes immediately
    if (shouldBeDark) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    // Apply accent color
    const colorMap = {
      indigo: { primary: '99 102 241', secondary: '129 140 248' },
      blue: { primary: '59 130 246', secondary: '96 165 250' },
      purple: { primary: '147 51 234', secondary: '168 85 247' },
      pink: { primary: '236 72 153', secondary: '244 114 182' },
      emerald: { primary: '16 185 129', secondary: '52 211 153' },
      orange: { primary: '249 115 22', secondary: '251 146 60' }
    };

    const colors = colorMap[accentColor];
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-light', colors.secondary);
  }, []); // Only run on mount

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('ai-tutor-theme', newTheme);
  };

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor);
    localStorage.setItem('ai-tutor-accent-color', newColor);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      accentColor,
      setTheme,
      setAccentColor,
      isDark
    }}>
      {children}
    </ThemeContext.Provider>
  );
};