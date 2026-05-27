/** Temporary Horizon assets until dedicated Hertz logo files are ready. */
export const BRAND_LOGO_PATHS = {
  full: {
    dark: '/images/logo/Logo-Horizon-Big-white-04-02.png',
    light: '/images/logo/Logo-Horizon-Big-black-04.png',
  },
  compact: {
    dark: '/images/logo/Logo-Horizon-big-No-tag-line-white_10.png',
    light: '/images/logo/Logo-Horizon-big-No-tag-line_9.png',
  },
  standard: {
    dark: '/images/logo/Logo-Horizon-White-05-05.png',
    light: '/images/logo/Logo-Horizon-Black-06.png',
  },
  atom: {
    dark: '/images/logo/Logo-Horizon-Atom-Online-White_8.png',
    light: '/images/logo/Logo-Horizon-Atom-Online-Black_7.png',
  },
} as const;

export const BRAND_LOGO_ATOM_WHITE = BRAND_LOGO_PATHS.atom.dark;
export const BRAND_LOGO_ATOM_BLACK = BRAND_LOGO_PATHS.atom.light;
