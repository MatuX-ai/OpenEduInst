/**
 * XLSX 按需加载封装服务（阶段二 2.7）
 *
 * 原始问题：xlsx 库约 800KB，整包同步 import 会阻塞主线程并拉大主 bundle 体积。
 * 解决方案：把 xlsx 包的引入放在动态 import 中，仅在用户触发导入/导出时才加载。
 *
 * 使用方式：
 * ```ts
 * constructor(private xlsx: XlsxLoaderService) {}
 * async download() {
 *   const XLSX = await this.xlsx.load();
 *   XLSX.utils.book_new();
 * }
 * ```
 */

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class XlsxLoaderService {
  private _module: typeof import('xlsx') | null = null;
  private _loading: Promise<typeof import('xlsx')> | null = null;

  /**
   * 懒加载 xlsx 库（同一会话内仅加载一次）
   */
  async load(): Promise<typeof import('xlsx')> {
    if (this._module) {
      return this._module;
    }
    if (!this._loading) {
      this._loading = import('xlsx').then((m) => {
        this._module = m;
        return m;
      });
    }
    return this._loading;
  }

  /**
   * 同步获取（仅在 load() 已成功后使用），否则抛出错误提示先 await load()
   */
  get module(): typeof import('xlsx') {
    if (!this._module) {
      throw new Error('XlsxLoaderService: xlsx 未加载，请先调用 await load()');
    }
    return this._module;
  }

  /**
   * 资源清理（测试用）
   */
  reset(): void {
    this._module = null;
    this._loading = null;
  }
}
