import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useNotification = () => {
  const notify = (
    message: string,
    type: ToastType = 'info',
    options?: ToastOptions
  ) => {
    const { duration = 5000, description, action } = options || {};

    const toastConfig = {
      description,
      duration,
      action: action ? { label: action.label, onClick: action.onClick } : undefined,
    };

    switch (type) {
      case 'success':
        toast.success(message, toastConfig);
        break;
      case 'error':
        toast.error(message, toastConfig);
        break;
      case 'warning':
        toast.warning(message, toastConfig);
        break;
      case 'info':
      default:
        toast.info(message, toastConfig);
        break;
    }
  };

  const success = (message: string, options?: ToastOptions) => 
    notify(message, 'success', options);

  const error = (message: string, options?: ToastOptions) => 
    notify(message, 'error', options);

  const warning = (message: string, options?: ToastOptions) => 
    notify(message, 'warning', options);

  const info = (message: string, options?: ToastOptions) => 
    notify(message, 'info', options);

  const loading = (message: string) => 
    toast.loading(message);

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error?: string;
    }
  ) => {
    return toast.promise(promise, messages);
  };

  return {
    notify,
    success,
    error,
    warning,
    info,
    loading,
    promise,
  };
};

// Para uso anterior a hooks em componentes de classe
export const notificationService = {
  success: (message: string, options?: ToastOptions) => 
    useNotification().success(message, options),
  error: (message: string, options?: ToastOptions) => 
    useNotification().error(message, options),
  warning: (message: string, options?: ToastOptions) => 
    useNotification().warning(message, options),
  info: (message: string, options?: ToastOptions) => 
    useNotification().info(message, options),
};
