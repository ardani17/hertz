export function shouldOpenDesktopPostModal(viewportWidth: number) {
  return viewportWidth >= 1025;
}

export function getHertzPostDetailMobileMarketPosition() {
  return 'after' as const;
}
