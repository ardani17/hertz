console.warn(JSON.stringify({
  level: 'warn',
  deprecation: 'mobile_service_import',
  from: '@shared/services/mobileAuthService',
  to: '@/server/services/auth/MobileAuthService',
}));

export {
  MobileAuthCurrentSessionRevokeError,
  MobileAuthNonceInvalidError,
  MobileAuthService,
  MobileAuthValidationError,
} from '../../frontend/src/server/services/auth/MobileAuthService';

