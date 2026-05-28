import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styles: []
})
export class AppComponent {
  title = 'openmt-edu-inst';

  constructor() {
    // 从 URL 查询参数中读取 Token（支持从营销网站 3000 端口登录后跳转）
    // 在 constructor 中执行，确保在路由守卫检查之前 token 已保存到 localStorage
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('access_token', token);
      console.log('Token 已自动从 URL 参数加载到 localStorage');
      // 清除 URL 中的 token 参数，避免安全风险
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      // 触发异步加载用户信息（由 AuthService 在后续初始化中处理）
    }
  }
}
