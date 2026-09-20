import type { Theme } from '../types';

interface ThemeSwitchProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSwitch({ theme, onThemeChange }: ThemeSwitchProps) {
  return (
    <div className="theme-switch">
      <button
        className={theme === 'vintage' ? 'active' : ''}
        onClick={() => onThemeChange('vintage')}
      >
        复古
      </button>
      <button
        className={theme === 'modern' ? 'active' : ''}
        onClick={() => onThemeChange('modern')}
      >
        现代
      </button>
    </div>
  );
}
