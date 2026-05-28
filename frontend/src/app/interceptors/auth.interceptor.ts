import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  // 调试日志
  console.log('[AuthInterceptor] Request URL:', req.url);
  console.log('[AuthInterceptor] Token exists:', !!token);
  
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('[AuthInterceptor] Added Authorization header');
    return next(cloned);
  }
  console.log('[AuthInterceptor] No token, proceeding without auth');
  return next(req);
};
