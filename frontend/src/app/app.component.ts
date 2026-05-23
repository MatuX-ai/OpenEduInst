import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styles: []
})
export class AppComponent implements OnInit {
  title = 'openmt-edu-inst';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // 从 URL 参数中读取 Token（支持从营销网站跳转）
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        localStorage.setItem('access_token', token);
        console.log('Token 已自动从 URL 参数加载到 localStorage');
      }
    });
  }
}
