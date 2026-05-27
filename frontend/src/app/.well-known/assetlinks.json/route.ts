import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const packageName = process.env.MOBILE_APP_PACKAGE_ANDROID?.trim() || 'com.hertz.app';
  const scheme = process.env.MOBILE_DEEP_LINK_SCHEME?.trim() || 'hertz';
  return NextResponse.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: packageName,
      sha256_cert_fingerprints: [],
    },
    include: [`/${scheme}/*`],
  }]);
}
