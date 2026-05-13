// Toast System
export {
  NotificationProvider,
  useNotification,
  useToast,
  triggerNotification,
  setGlobalNotifier,
  showGlobalNotification,
  type Notification,
  type NotificationType,
} from "./toast-system";

// Modal System
export {
  ModalProvider,
  useModal,
  useConfirmModal,
  type ModalType,
  type ModalConfig,
} from "./modal-system";

// Loading States
export {
  LoadingProvider,
  GlobalLoadingOverlay,
  useLoading,
  useButtonLoading,
  useApiLoading,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonGrid,
  PageLoader,
  LoadingSpinner,
  FormSubmitButton,
  AsyncButton,
} from "./loading-states";

// Error Handler
export {
  ErrorHandler,
  getErrorHandler,
  isSuccessResponse,
  isErrorResponse,
  withErrorHandling,
  handleAuthError,
  handleFormError,
  retryWithBackoff,
  debounceError,
  setupGlobalErrorHandlers,
  type ApiError,
  type ErrorResponse,
} from "./error-handler";

// Real-time Notifications
export {
  RealtimeProvider,
  useRealtime,
  useRealtimeEvent,
  useOrderRealtime,
  playNotificationSound,
  type EventType,
  type RealtimeEvent,
} from "./realtime-notifications";