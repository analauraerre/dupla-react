import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContextCore';
import { contrastFg } from '../utils/themeStyles';

export function useTheme() {
  return useContext(ThemeContext);
}

export { contrastFg };
