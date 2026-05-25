export interface ReviewPage {
  name: string;
  path: string;
}

export interface ReviewViewport {
  name: string;
  width: number;
  height: number;
}

export const reviewPages: ReviewPage[] = [
  { name: 'landing', path: '/' },
  { name: 'hertz-feed', path: '/hertz' },
  { name: 'hertz-profile', path: '/hertz/profile' },
  { name: 'hertz-messages', path: '/hertz/messages' },
  { name: 'hertz-notifications', path: '/hertz/notifications' },
  { name: 'outlook', path: '/outlook' },
  { name: 'tools', path: '/tools' },
  { name: 'tools-challenge', path: '/tools/challenge-tracker' },
  { name: 'admin-login', path: '/admin/login' },
];

export const reviewViewports: ReviewViewport[] = [
  { name: 'desktop-1440', width: 1440, height: 950 },
  { name: 'desktop-1365', width: 1365, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 740 },
];

export function makeReviewTitle(pageName: string, viewportName: string) {
  return `${pageName} @ ${viewportName}`;
}

export function makeSnapshotName(pageName: string, viewportName: string) {
  return `${pageName}-${viewportName}.png`;
}

export async function stabilizePage(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
}
