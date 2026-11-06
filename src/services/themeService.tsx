import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppThemeId =
  | 'solar_light'
  | 'golden_navy'
  | 'amber_work'
  | 'sky_cyan'
  | 'emerald_nature'
  | 'night';

export interface ThemeConfig {
  id: AppThemeId;
  name: string;
  subtitle: string;
  isLight: boolean;
  colors: {
    primary: string; // e.g. '#00A3FF'
    secondary: string;
    accent: string;
    bgMain: string;
    bgWrapper: string;
    bgCard: string;
    bgCardSubtle: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    glow: string;
  };
  classes: {
    outerBg: string;
    wrapperBg: string;
    headerBg: string;
    navBg: string;
    cardBg: string;
    cardSubtleBg: string;
    cardBorder: string;
    textMain: string;
    textMuted: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    modalBg: string;
    glowBlob1: string;
    glowBlob2: string;
    pillActive: string;
  };
}

export const APP_THEMES: Record<AppThemeId, ThemeConfig> = {
  // 1. DEFAULT: unified blue + mint learning identity
  solar_light: {
    id: 'solar_light',
    name: 'الأزرق النعناعي (الافتراضي)',
    subtitle: 'واجهة تعليمية هادئة تجمع الأزرق الواضح والنعناعي مع قراءة مريحة',
    isLight: true,
    colors: {
      primary: '#087FE5',
      secondary: '#43D5A0',
      accent: '#61C8BC',
      bgMain: '#DDF3FF',
      bgWrapper: '#F5FBFF',
      bgCard: '#FFFFFF',
      bgCardSubtle: '#EDF9FC',
      border: 'rgba(8,127,229,0.16)',
      textPrimary: '#23313D',
      textSecondary: '#526979',
      glow: 'rgba(8,127,229,0.18)',
    },
    classes: {
      outerBg: 'bg-[#DDF3FF]',
      wrapperBg: 'bg-gradient-to-b from-[#FFFFFF] via-[#F5FBFF] to-[#DDF3FF]',
      headerBg: 'bg-white/95',
      navBg: 'bg-white/95',
      cardBg: 'bg-white shadow-md',
      cardSubtleBg: 'bg-[#EDF9FC]',
      cardBorder: 'border-slate-200/80 shadow-sm',
      textMain: 'text-[#23313D]',
      textMuted: 'text-[#526979]',
      accentText: 'text-[#087FE5]',
      accentBg: 'bg-gradient-to-r from-[#087FE5] to-[#43D5A0] text-white',
      accentBorder: 'border-[#087FE5]/40',
      modalBg: 'bg-white text-[#23313D]',
      glowBlob1: 'bg-[#087FE5]/10',
      glowBlob2: 'bg-[#43D5A0]/12',
      pillActive: 'bg-[#087FE5] text-white',
    },
  },

  // 2. Golden Royal (Light Ivory with Gold & Amber Accents)
  golden_navy: {
    id: 'golden_navy',
    name: 'النمط الذهبي الملكي',
    subtitle: 'أصفر ذهبي وبرتقالي ملكي متناسق مع خلفية عاجية فاتحة مشرقة',
    isLight: true,
    colors: {
      primary: '#D97706',
      secondary: '#F59E0B',
      accent: '#EA580C',
      bgMain: '#FEF3C7',
      bgWrapper: '#FFFDF5',
      bgCard: '#FFFFFF',
      bgCardSubtle: '#FEF9C3',
      border: 'rgba(217,119,6,0.25)',
      textPrimary: '#451A03',
      textSecondary: '#78350F',
      glow: 'rgba(217, 119, 6, 0.2)',
    },
    classes: {
      outerBg: 'bg-[#FEF3C7]',
      wrapperBg: 'bg-gradient-to-b from-[#FFFDF5] via-[#FEF9EE] to-[#FEF3C7]',
      headerBg: 'bg-[#FFFDF5]/95',
      navBg: 'bg-[#FFFDF5]/95',
      cardBg: 'bg-white shadow-md',
      cardSubtleBg: 'bg-[#FEF9EE]',
      cardBorder: 'border-amber-200 shadow-sm',
      textMain: 'text-amber-950',
      textMuted: 'text-amber-700/80',
      accentText: 'text-amber-600',
      accentBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      accentBorder: 'border-amber-400/60',
      modalBg: 'bg-white text-amber-950',
      glowBlob1: 'bg-amber-400/15',
      glowBlob2: 'bg-orange-400/15',
      pillActive: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    },
  },

  // 3. Electric Coral Teal — derived from the approved classroom/game references.
  amber_work: {
    id: 'amber_work',
    name: 'النمط الكهربائي المرجاني',
    subtitle: 'مرجاني وفيروزي فوق درجات فحمية ورملية، بلا أسطح بيضاء',
    isLight: false,
    colors: {
      primary: '#F0AAA6',
      secondary: '#63C8BD',
      accent: '#C8A86D',
      bgMain: '#142629',
      bgWrapper: '#1B3234',
      bgCard: '#294744',
      bgCardSubtle: '#355956',
      border: 'rgba(99,200,189,0.34)',
      textPrimary: '#F1DEC0',
      textSecondary: '#CEB98F',
      glow: 'rgba(240,170,166,0.22)',
    },
    classes: {
      outerBg: 'bg-[#142629]',
      wrapperBg: 'bg-gradient-to-b from-[#1B3234] via-[#203B3B] to-[#3C3430]',
      headerBg: 'bg-[#193032]/95',
      navBg: 'bg-[#193032]/95',
      cardBg: 'bg-[#294744] shadow-md',
      cardSubtleBg: 'bg-[#355956]',
      cardBorder: 'border-[#63C8BD]/35 shadow-sm',
      textMain: 'text-[#F1DEC0]',
      textMuted: 'text-[#CEB98F]',
      accentText: 'text-[#63C8BD]',
      accentBg: 'bg-gradient-to-r from-[#F0AAA6] via-[#C8A86D] to-[#63C8BD] text-[#142629]',
      accentBorder: 'border-[#F0AAA6]/55',
      modalBg: 'bg-[#294744] text-[#F1DEC0]',
      glowBlob1: 'bg-[#F0AAA6]/16',
      glowBlob2: 'bg-[#63C8BD]/16',
      pillActive: 'bg-[#63C8BD] text-[#142629]',
    },
  },

  // 4. Sky Cyan (Light Crystal Ice & Bright Cyan)
  sky_cyan: {
    id: 'sky_cyan',
    name: 'النمط السماوي الساطع',
    subtitle: 'أزرق سماوي ناصع مع خلفية جليدية بيضاء منعشة ومريحة',
    isLight: true,
    colors: {
      primary: '#0284C7',
      secondary: '#06B6D4',
      accent: '#0EA5E9',
      bgMain: '#E0F2FE',
      bgWrapper: '#F0F9FF',
      bgCard: '#FFFFFF',
      bgCardSubtle: '#E0F2FE',
      border: 'rgba(2,132,199,0.25)',
      textPrimary: '#0C4A6E',
      textSecondary: '#0369A1',
      glow: 'rgba(2, 132, 199, 0.2)',
    },
    classes: {
      outerBg: 'bg-[#E0F2FE]',
      wrapperBg: 'bg-gradient-to-b from-[#F0F9FF] via-[#E8F6FD] to-[#E0F2FE]',
      headerBg: 'bg-[#F0F9FF]/95',
      navBg: 'bg-[#F0F9FF]/95',
      cardBg: 'bg-white shadow-md',
      cardSubtleBg: 'bg-[#F0F9FF]',
      cardBorder: 'border-sky-200 shadow-sm',
      textMain: 'text-sky-950',
      textMuted: 'text-sky-700/80',
      accentText: 'text-sky-600',
      accentBg: 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white',
      accentBorder: 'border-sky-400/60',
      modalBg: 'bg-white text-sky-950',
      glowBlob1: 'bg-sky-400/15',
      glowBlob2: 'bg-cyan-400/15',
      pillActive: 'bg-sky-600 text-white',
    },
  },

  // 5. Emerald Nature (Light Mint & Emerald Green)
  emerald_nature: {
    id: 'emerald_nature',
    name: 'النمط الطبيعي الزمردي',
    subtitle: 'أخضر زمردي مهدئ بخلفية نعناعية بيضاء طبيعية تريح العينين',
    isLight: true,
    colors: {
      primary: '#059669',
      secondary: '#10B981',
      accent: '#0D9488',
      bgMain: '#D1FAE5',
      bgWrapper: '#F0FDF4',
      bgCard: '#FFFFFF',
      bgCardSubtle: '#ECFDF5',
      border: 'rgba(5,150,105,0.25)',
      textPrimary: '#064E3B',
      textSecondary: '#047857',
      glow: 'rgba(5, 150, 105, 0.2)',
    },
    classes: {
      outerBg: 'bg-[#D1FAE5]',
      wrapperBg: 'bg-gradient-to-b from-[#F0FDF4] via-[#E6F9EE] to-[#D1FAE5]',
      headerBg: 'bg-[#F0FDF4]/95',
      navBg: 'bg-[#F0FDF4]/95',
      cardBg: 'bg-white shadow-md',
      cardSubtleBg: 'bg-[#ECFDF5]',
      cardBorder: 'border-emerald-200 shadow-sm',
      textMain: 'text-emerald-950',
      textMuted: 'text-emerald-700/80',
      accentText: 'text-emerald-600',
      accentBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
      accentBorder: 'border-emerald-400/60',
      modalBg: 'bg-white text-emerald-950',
      glowBlob1: 'bg-emerald-400/15',
      glowBlob2: 'bg-teal-400/15',
      pillActive: 'bg-emerald-600 text-white',
    },
  },

  // 6. Quiet Black & Green Night Theme
  night: {
    id: 'night',
    name: 'النمط الليلي الأسود والأخضر',
    subtitle: 'خلفية سوداء هادئة مع أضواء خضراء خفيفة ومريحة للعين',
    isLight: false,
    colors: {
      primary: '#22C55E',
      secondary: '#4ADE80',
      accent: '#86EFAC',
      bgMain: '#020403',
      bgWrapper: '#06100A',
      bgCard: '#0B1510',
      bgCardSubtle: '#0A1F14',
      border: 'rgba(34,197,94,0.18)',
      textPrimary: '#F0FDF4',
      textSecondary: '#BBF7D0',
      glow: 'rgba(34, 197, 94, 0.18)',
    },
    classes: {
      outerBg: 'bg-[#020403]',
      wrapperBg: 'bg-gradient-to-b from-[#06100A] via-[#030804] to-[#010201]',
      headerBg: 'bg-[#07120B]/95',
      navBg: 'bg-[#07120B]/95',
      cardBg: 'bg-[#0B1510] shadow-md',
      cardSubtleBg: 'bg-[#0A1F14]',
      cardBorder: 'border-emerald-500/20 shadow-sm',
      textMain: 'text-emerald-50',
      textMuted: 'text-emerald-200/70',
      accentText: 'text-emerald-400',
      accentBg: 'bg-gradient-to-r from-emerald-600 to-green-500 text-black',
      accentBorder: 'border-emerald-400/60',
      modalBg: 'bg-[#0B1510] text-emerald-50',
      glowBlob1: 'bg-emerald-500/12',
      glowBlob2: 'bg-lime-400/10',
      pillActive: 'bg-emerald-600 text-black',
    },
  },
};

const THEME_STORAGE_KEY = 'nahnu_maak_app_theme_v2';
const THEME_STORAGE_FALLBACK_KEY = 'nahnu_maak_theme_backup';

interface ThemeContextType {
  currentThemeId: AppThemeId;
  theme: ThemeConfig;
  setThemeId: (id: AppThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  currentThemeId: 'solar_light',
  theme: APP_THEMES.solar_light,
  setThemeId: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState<AppThemeId>(() => {
    try {
      const saved = (localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(THEME_STORAGE_FALLBACK_KEY)) as AppThemeId;
      if (saved && APP_THEMES[saved]) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'solar_light'; // Default is the bright solar theme
  });

  const setThemeId = (id: AppThemeId) => {
    if (APP_THEMES[id]) {
      setCurrentThemeId(id);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, id);
        localStorage.setItem(THEME_STORAGE_FALLBACK_KEY, id);
      } catch {
        // ignore
      }
    }
  };

  const theme = APP_THEMES[currentThemeId] || APP_THEMES.solar_light;

  useEffect(() => {
    document.documentElement.dataset.appTheme = currentThemeId;
    document.body.dataset.appTheme = currentThemeId;
    return () => {
      delete document.documentElement.dataset.appTheme;
      delete document.body.dataset.appTheme;
    };
  }, [currentThemeId]);

  return (
    <ThemeContext.Provider value={{ currentThemeId, theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
