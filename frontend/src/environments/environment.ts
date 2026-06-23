export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000',
  /** OpenMTSciEd 经后端代理 /api/v1/opensciedu，勿直连上游 */
  openMtSciEdProxyPath: '/api/v1/opensciedu',
  useMockData: false, // 云托管版：连接到后端 API + Neon 云数据库
  mockDataDelay: 0,
};
