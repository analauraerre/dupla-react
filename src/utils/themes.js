export const THEMES = {
  dupla: {
    id: 'dupla', name: 'Dupla', emoji: '🌿', dark: false,
    // coral = Verde Dupla: primary actions, nav, buttons
    coral:'#0F7B5C', coralL:'#E5F1EC', coralM:'#F2F9F6',
    // sage = Éxito: ingresos, ahorros, confirmaciones
    sage:'#16A57A',  sageL:'#E0F4EC',  sageM:'#F0FAF5',
    // peach = Coral Dupla: acento emocional (no semántico)
    peach:'#FF6B5B', peachL:'#FFE8E5', peachD:'#E5503F',
    // sky = Verde oscuro: hover, variante oscura
    sky:'#0A5D45',   skyL:'#E5F1EC',
    // lavender = Aviso: cerca del límite
    lavender:'#E89F2C', lavL:'#FCF0DC',
    // rose = Alerta: gastos, errores
    rose:'#E04545',  roseL:'#FBE5E5',
    // gold = Aviso (alias)
    gold:'#E89F2C',  goldL:'#FCF0DC',
    // Neutros
    gray1:'#1A1A1A', gray2:'#444444', gray3:'#717171',
    gray4:'#B5B5B5', gray5:'#E5E5E5', gray6:'#F5F5F2',
    white:'#FFFFFF', border:'#E5E5E5', bg:'#FAFAF7',
  },

  duplaDark: {
    id: 'duplaDark', name: 'Dupla Dark', emoji: '🌙', dark: true,
    // Same semantic colors as light mode, but optimized for dark backgrounds
    coral:'#2DB88F', coralL:'#1A4D3D', coralM:'#2D6B5C',
    sage:'#2DB88F',  sageL:'#1A4D3D',  sageM:'#2D6B5C',
    peach:'#FF8873', peachL:'#4D3D35', peachD:'#FF6B5B',
    sky:'#2DB88F',   skyL:'#1A4D3D',
    lavender:'#F5B74D', lavL:'#4D3D1A',
    rose:'#FF6B6B',  roseL:'#4D2222',
    gold:'#F5B74D',  goldL:'#4D3D1A',
    // Dark mode grays with good contrast
    gray1:'#F5F5F5', gray2:'#D4D4D4', gray3:'#A0A0A0',
    gray4:'#707070', gray5:'#404040', gray6:'#252525',
    white:'#1A1A1A', border:'#404040', bg:'#0F0F0F',
  },
};

export const THEME_LIST = Object.values(THEMES);
export const DEFAULT_THEME_ID = 'dupla';
