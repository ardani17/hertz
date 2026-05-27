console.warn(JSON.stringify({
  level: 'warn',
  deprecation: 'mobile_service_import',
  from: '@shared/services/mobileMediaService',
  to: '@/server/services/media/MobileMediaService',
}));

export {
  MobileMediaService,
  MobileMediaValidationError,
} from '../../frontend/src/server/services/media/MobileMediaService';
