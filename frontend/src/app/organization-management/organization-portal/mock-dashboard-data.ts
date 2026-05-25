import { DashboardData, Organization } from './organization-dashboard.service';

export const mockOrganizations: Organization[] = [
  {
    id: 1,
    name: '星海机器人培训',
    contact_email: 'admin@starhai-robotics.com',
    phone: '010-88886666',
    address: '北京市海淀区中关村大街88号',
    website: 'https://www.starhai-robotics.com',
    max_users: 500,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockDashboardData: Record<number, DashboardData> = {
  1: {
    organization: mockOrganizations[0],
    statistics: {
      activeLicenses: 185,
      totalProjects: 243,
      totalUsers: 1247,
      hardwareConsumption: 1250,
      licenseRemaining: 15,
    },
    charts: {
      userGrowthData: [
        { date: '2024-01', value: 1000 },
        { date: '2024-02', value: 1050 },
        { date: '2024-03', value: 1120 },
        { date: '2024-04', value: 1180 },
        { date: '2024-05', value: 1230 },
        { date: '2024-06', value: 1247 },
      ],
      projectTrendData: [
        { date: '2024-01', value: 180 },
        { date: '2024-02', value: 195 },
        { date: '2024-03', value: 210 },
        { date: '2024-04', value: 225 },
        { date: '2024-05', value: 235 },
        { date: '2024-06', value: 243 },
      ],
      hardwareUsageData: [
        { category: 'Arduino', value: 45, date: '' },
        { category: 'Raspberry Pi', value: 32, date: '' },
        { category: '传感器', value: 18, date: '' },
        { category: '其他设备', value: 5, date: '' },
      ],
      licenseUsageData: [
        { date: '', value: 185 },
        { date: '', value: 15 },
        { date: '', value: 200 },
      ],
    },
    recentActivities: [
      {
        id: 1,
        type: 'user_login',
        description: '管理员登录系统',
        timestamp: new Date().toISOString(),
        severity: 'info',
      },
      {
        id: 2,
        type: 'project_created',
        description: '创建了新的机器人编程项目',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        severity: 'info',
      },
      {
        id: 3,
        type: 'license_used',
        description: '激活了5个新许可证',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        severity: 'warning',
      },
      {
        id: 4,
        type: 'hardware_access',
        description: 'Arduino设备使用率达到85%',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        severity: 'warning',
      },
    ],
    alerts: [
      {
        id: 1,
        type: 'license_expiring',
        message: '许可证即将到期，请及时续费',
        severity: 'medium',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 2,
        type: 'hardware_limit',
        message: '硬件设备使用接近上限',
        severity: 'low',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
  },
};

export function getMockDashboardData(orgId: number): DashboardData {
  return mockDashboardData[orgId] || mockDashboardData[1];
}

export function getMockOrganization(orgId: number): Organization {
  return mockOrganizations.find((org) => org.id === orgId) || mockOrganizations[0];
}
