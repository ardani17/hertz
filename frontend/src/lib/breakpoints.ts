/** Shared viewport breakpoints (px). Use in CSS modules via media queries. */
export const breakpoints = {
  mobileSm: 320,
  mobile: 390,
  tablet: 768,
  desktop: 1024,
  desktopLg: 1440,
} as const;

export type BreakpointName = keyof typeof breakpoints;

/** CSS media query strings for use in modules or styled logic */
export const mediaQueries = {
  mobileSmUp: `(min-width: ${breakpoints.mobileSm}px)`,
  mobileUp: `(min-width: ${breakpoints.mobile}px)`,
  tabletUp: `(min-width: ${breakpoints.tablet}px)`,
  desktopUp: `(min-width: ${breakpoints.desktop}px)`,
  desktopLgUp: `(min-width: ${breakpoints.desktopLg}px)`,
  belowTablet: `(max-width: ${breakpoints.tablet - 1}px)`,
  belowDesktop: `(max-width: ${breakpoints.desktop - 1}px)`,
} as const;
