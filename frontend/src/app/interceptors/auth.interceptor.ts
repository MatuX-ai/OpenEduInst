import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (!environment.production) {
    console.log('[AuthInterceptor] Request URL:', req.url);
    console.log('[AuthInterceptor] Token exists:', !!token);
  }

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!environment.production) {
      console.log('[AuthInterceptor] Added Authorization header');
    }
    return next(cloned);
  }
  return next(req);
};
