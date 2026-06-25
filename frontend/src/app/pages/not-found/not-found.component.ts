import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 2rem;
    ">
      <h1 style="font-size: 4rem; margin: 0; color: #e53e3e;">404</h1>
      <h2 style="margin: 0.5rem 0 1.5rem;">页面未找到</h2>
      <p style="color: #718096; margin-bottom: 2rem;">
        您访问的页面不存在，可能已被移除或地址输入有误。
      </p>
      <a routerLink="/organization" style="
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background-color: #3182ce;
        color: #fff;
        border-radius: 0.5rem;
        text-decoration: none;
        font-weight: 500;
      ">返回首页</a>
    </div>
  `,
})
export class NotFoundComponent {}