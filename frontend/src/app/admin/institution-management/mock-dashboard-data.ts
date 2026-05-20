/**
 * Mock Dashboard Data
 *
 * 模拟仪表板数据 - 用于测试和开发
 * TODO: 后续实现真实的 Dashboard Service
 */

// 临时类型定义
export interface Institution {
  id: number;
  name: string;
  contact_email: string;
  phone?: string;
  address?: string;
  website?: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  organization: Institution;
  statistics: {
    activeLicenses: number;
    totalProjects: number;
    totalUsers: number;
    hardwareConsumption: number;
    licenseRemaining: number;
  };
  charts: {
    userGrowthData: Array<{ date: string; value: number }>;
    projectTrendData: Array<{ date: string; value: number }>;
    hardwareUsageData: Array<{ category: string; value: number; date: string }>;
    licenseUsageData: Array<{ date: string; value: number }>;
  };
  recentActivities: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    severity: string;
  }>;
  alerts: Array<{
    id: number;
    type: string;
    message: string;
    severity: string;
    createdAt: string;
  }>;
}

export const mockOrganizations: Institution[] = [
  {
    id: 1,
    name: '北京市第一中学',
    contact_email: 'admin@bj1school.edu.cn',
    phone: '010-66668888',
    address: '北京市朝阳区建国路1号',
    website: 'https://www.bj1school.edu.cn',
    max_users: 2000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '上海市实验学校',
    contact_email: 'contact@sh-experiment.edu.cn',
    phone: '021-55556666',
    address: '上海市浦东新区张江路123号',
    website: 'https://www.sh-experiment.edu.cn',
    max_users: 1500,
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
        description: '用户张老师登录系统',
        timestamp: new Date().toISOString(),
        severity: 'info',
      },
      {
        id: 2,
        type: 'project_created',
        description: '创建了新的物理实验项目',
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
  2: {
    organization: mockOrganizations[1],
    statistics: {
      activeLicenses: 142,
      totalProjects: 187,
      totalUsers: 986,
      hardwareConsumption: 890,
      licenseRemaining: 8,
    },
    charts: {
      userGrowthData: [
        { date: '2024-01', value: 800 },
        { date: '2024-02', value: 840 },
        { date: '2024-03', value: 890 },
        { date: '2024-04', value: 930 },
        { date: '2024-05', value: 960 },
        { date: '2024-06', value: 986 },
      ],
      projectTrendData: [
        { date: '2024-01', value: 140 },
        { date: '2024-02', value: 152 },
        { date: '2024-03', value: 165 },
        { date: '2024-04', value: 172 },
        { date: '2024-05', value: 180 },
        { date: '2024-06', value: 187 },
      ],
      hardwareUsageData: [
        { category: 'Arduino', value: 38, date: '' },
        { category: 'Raspberry Pi', value: 28, date: '' },
        { category: '传感器', value: 22, date: '' },
        { category: '其他设备', value: 2, date: '' },
      ],
      licenseUsageData: [
        { date: '', value: 142 },
        { date: '', value: 8 },
        { date: '', value: 150 },
      ],
    },
    recentActivities: [
      {
        id: 1,
        type: 'user_login',
        description: '用户李老师登录系统',
        timestamp: new Date().toISOString(),
        severity: 'info',
      },
      {
        id: 2,
        type: 'project_created',
        description: '创建了化学实验数据分析项目',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        severity: 'info',
      },
      {
        id: 3,
        type: 'license_used',
        description: '激活了3个新许可证',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        severity: 'info',
      },
    ],
    alerts: [
      {
        id: 1,
        type: 'license_expiring',
        message: '许可证将在30天后到期',
        severity: 'low',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ],
  },
};

export function getMockDashboardData(orgId: number): DashboardData {
  return mockDashboardData[orgId] ?? mockDashboardData[1];
}

export function getMockOrganization(orgId: number): Institution {
  return mockOrganizations.find((org) => org.id === orgId) ?? mockOrganizations[0];
}
