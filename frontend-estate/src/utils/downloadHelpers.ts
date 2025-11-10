// src/utils/downloadHelpers.ts
// Utility functions for handling file downloads in mobile apps and WebView environments

/**
 * Detects if the app is running in a WebView/mobile app environment
 */
export const isWebView = (): boolean => {
  const userAgent = navigator.userAgent || (navigator as any).vendor || (window as any).opera;

  return (
    // Android WebView
    /wv|WebView/.test(userAgent) ||
    // iOS WebView (Safari not in user agent)
    /(iPhone|iPod|iPad)(?!.*Safari\/)/i.test(userAgent) ||
    // Appilix or other converters
    /Appilix|WebViewApp|ConverterApp/.test(userAgent) ||
    // Facebook/Instagram in-app browser
    /FBAN|FBAV|Instagram/.test(userAgent)
  );
};

/**
 * Downloads a file with WebView compatibility
 * For mobile apps, opens in new tab instead of blob download
 */
export const downloadFile = async (
  url: string,
  filename: string,
  options?: {
    responseType?: 'blob' | 'arraybuffer';
    onProgress?: (progress: number) => void;
  }
): Promise<void> => {
  const isInWebView = isWebView();

  if (isInWebView) {
    // For WebView/mobile apps: Open directly in new window
    // The backend will handle the download with proper headers
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    window.open(fullUrl, '_blank');
    return;
  }

  // For regular browsers: Use blob download
  try {
    const axios = (await import('../api')).default;

    const response = await axios.get(url, {
      responseType: options?.responseType || 'blob',
      onDownloadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          options.onProgress(percentCompleted);
        }
      },
    });

    // Create blob link to download
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

/**
 * Opens a file for viewing (inline) with WebView compatibility
 */
export const viewFile = (url: string): void => {
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  window.open(fullUrl, '_blank');
};

/**
 * Get user agent information for debugging
 */
export const getUserAgentInfo = (): {
  userAgent: string;
  isWebView: boolean;
  isMobile: boolean;
  platform: string;
} => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return {
    userAgent,
    isWebView: isWebView(),
    isMobile,
    platform: navigator.platform,
  };
};
