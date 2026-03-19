export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message, timestamp: new Date().toISOString() };
}

export function fail(error: string): ApiResponse<null> {
  return { success: false, error, timestamp: new Date().toISOString() };
}
