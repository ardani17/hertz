import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const appId = process.env.MOBILE_APP_BUNDLE_ID_IOS?.trim() || 'com.hertz.app';
  const scheme = process.env.MOBILE_DEEP_LINK_SCHEME?.trim() || 'hertz';
  return NextResponse.json({
    applinks: {
      apps: [],
      details: [{
        appID: appId.includes('.') ? appId : `TEAMID.${appId}`,
        paths: ['/auth/mobile-handoff*', `/${scheme}/*`],
      }],
    },
  });
}
