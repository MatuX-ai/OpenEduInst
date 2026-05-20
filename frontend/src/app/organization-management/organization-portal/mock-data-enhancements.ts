/**
 * 机构管理云托管版 - Mock 数据增强
 *
 * 结合本项目课程体系特点，提供真实感强的模拟数据
 * 包括：学科分类、课程类型、教学场景等
 */

/**
 * 学科枚举（基于国家课程标准）
 */
export const SUBJECTS = {
  // STEM 核心学科
  MATH: 'math',
  PHYSICS: 'physics',
  CHEMISTRY: 'chemistry',
  BIOLOGY: 'biology',

  // 语言类
  CHINESE: 'chinese',
  ENGLISH: 'english',

  // 人文社科
  HISTORY: 'history',
  GEOGRAPHY: 'geography',
  POLITICS: 'politics',

  // 艺术与体育
  MUSIC: 'music',
  ART: 'art',
  PE: 'physical_education',

  // 信息技术
  COMPUTER_SCIENCE: 'computer_science',
  AI_EDUCATION: 'ai_education',

  // 综合实践
  GENERAL_PRACTICE: 'general_practice',
} as const;

/**
 * 学科中文名称映射
 */
export const SUBJECT_LABELS: Record<string, string> = {
  [SUBJECTS.MATH]: '数学',
  [SUBJECTS.PHYSICS]: '物理',
  [SUBJECTS.CHEMISTRY]: '化学',
  [SUBJECTS.BIOLOGY]: '生物',
  [SUBJECTS.CHINESE]: '语文',
  [SUBJECTS.ENGLISH]: '英语',
  [SUBJECTS.HISTORY]: '历史',
  [SUBJECTS.GEOGRAPHY]: '地理',
  [SUBJECTS.POLITICS]: '政治',
  [SUBJECTS.MUSIC]: '音乐',
  [SUBJECTS.ART]: '美术',
  [SUBJECTS.PE]: '体育',
  [SUBJECTS.COMPUTER_SCIENCE]: '信息技术',
  [SUBJECTS.AI_EDUCATION]: 'AI教育',
  [SUBJECTS.GENERAL_PRACTICE]: '综合实践',
};

/**
 * 课程难度等级
 */
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

/**
 * 课程来源类型
 */
export const COURSE_SOURCE_TYPES = {
  SCHOOL_CURRICULUM: 'school_curriculum', // 学校必修课程
  SCHOOL_INTEREST: 'school_interest',     // 学校兴趣课程
  INSTITUTION: 'institution',             // 机构特色课程
} as const;

/**
 * 课程内容类型
 */
export const CONTENT_TYPES = {
  LECTURE: 'lecture',         // 理论课
  LAB: 'lab',                 // 实验课
  WORKSHOP: 'workshop',       // 工作坊
  DISCUSSION: 'discussion',   // 讨论课
  EXAM: 'exam',               // 考试
  ASSIGNMENT: 'assignment',   // 作业
} as const;

/**
 * 排课模式
 */
export const SCHEDULE_PATTERNS = {
  WEEKLY: 'weekly',       // 每周
  BIWEEKLY: 'biweekly',   // 隔周
  MONTHLY: 'monthly',     // 每月
  CUSTOM: 'custom',       // 自定义
} as const;

/**
 * 教师职位
 */
export const TEACHER_POSITIONS = {
  SENIOR_TEACHER: '高级教师',
  TEACHING_RESEARCH_LEADER: '教研组长',
  TEACHER: '教师',
  ASSISTANT_TEACHER: '助教',
  GUEST_PROFESSOR: '客座教授',
} as const;

/**
 * 学生年级（K12）
 */
export const GRADE_LEVELS = {
  PRIMARY_1: '小学一年级',
  PRIMARY_2: '小学二年级',
  PRIMARY_3: '小学三年级',
  PRIMARY_4: '小学四年级',
  PRIMARY_5: '小学五年级',
  PRIMARY_6: '小学六年级',
  MIDDLE_1: '初一',
  MIDDLE_2: '初二',
  MIDDLE_3: '初三',
  HIGH_1: '高一',
  HIGH_2: '高二',
  HIGH_3: '高三',
} as const;

/**
 * 典型课程示例（符合中国教育体系）
 */
export const SAMPLE_COURSES = {
  // 数学系列
  MATH_BASIC: {
    title: '初中数学基础',
    subject: SUBJECTS.MATH,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    sourceType: COURSE_SOURCE_TYPES.SCHOOL_CURRICULUM,
    totalLessons: 36,
    creditHours: 72,
  },
  MATH_ADVANCED: {
    title: '高中数学进阶',
    subject: SUBJECTS.MATH,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    sourceType: COURSE_SOURCE_TYPES.SCHOOL_CURRICULUM,
    totalLessons: 48,
    creditHours: 96,
  },

  // 英语系列
  ENGLISH_COMMUNICATION: {
    title: '英语口语交际',
    subject: SUBJECTS.ENGLISH,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    sourceType: COURSE_SOURCE_TYPES.SCHOOL_INTEREST,
    totalLessons: 24,
    creditHours: 48,
  },

  // 物理系列
  PHYSICS_EXPERIMENT: {
    title: '物理实验探究',
    subject: SUBJECTS.PHYSICS,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    sourceType: COURSE_SOURCE_TYPES.SCHOOL_CURRICULUM,
    totalLessons: 20,
    creditHours: 40,
  },

  // AI 教育（项目特色）
  AI_INTRO: {
    title: '人工智能入门',
    subject: SUBJECTS.AI_EDUCATION,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    sourceType: COURSE_SOURCE_TYPES.INSTITUTION,
    totalLessons: 16,
    creditHours: 32,
  },
  AI_PROGRAMMING: {
    title: 'AI 编程实践',
    subject: SUBJECTS.AI_EDUCATION,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    sourceType: COURSE_SOURCE_TYPES.INSTITUTION,
    totalLessons: 24,
    creditHours: 48,
  },

  // 综合实践
  ROBOTICS: {
    title: '机器人创客',
    subject: SUBJECTS.GENERAL_PRACTICE,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    sourceType: COURSE_SOURCE_TYPES.SCHOOL_INTEREST,
    totalLessons: 18,
    creditHours: 36,
  },
} as const;

/**
 * 典型教师画像
 */
export const TEACHER_PROFILES = {
  // 数学教师
  MATH_SENIOR: {
    department: '数学组',
    position: TEACHER_POSITIONS.SENIOR_TEACHER,
    bio: '从事数学教学 15 年，擅长启发式教学和数学思维训练',
    specialties: ['代数', '几何', '数学竞赛辅导'],
  },

  // 英语教师
  ENGLISH_EXPERT: {
    department: '英语组',
    position: TEACHER_POSITIONS.TEACHING_RESEARCH_LEADER,
    bio: '英语教学专家，雅思 8 分，擅长口语和写作教学',
    specialties: ['口语交际', '学术写作', 'IELTS 备考'],
  },

  // 物理教师
  PHYSICS_RESEARCHER: {
    department: '物理组',
    position: TEACHER_POSITIONS.TEACHER,
    bio: '物理学硕士，注重实验教学和学生科学素养培养',
    specialties: ['力学', '电磁学', '实验设计'],
  },

  // AI 教师（项目特色）
  AI_INSTRUCTOR: {
    department: '信息技术组',
    position: TEACHER_POSITIONS.TEACHER,
    bio: '人工智能专业博士，专注于 K12 AI 教育课程开发',
    specialties: ['机器学习基础', 'Python 编程', 'AI 伦理'],
  },
} as const;

/**
 * 典型学生画像
 */
export const STUDENT_PROFILES = {
  EXEMPLARY_STUDENT: {
    grade: GRADE_LEVELS.HIGH_2,
    performanceLevel: 'excellent',
    interests: ['数学', '编程', '物理'],
    learningStyle: 'visual', // 视觉型学习者
  },
  AVERAGE_STUDENT: {
    grade: GRADE_LEVELS.MIDDLE_2,
    performanceLevel: 'average',
    interests: ['英语', '音乐'],
    learningStyle: 'auditory', // 听觉型学习者
  },
  NEEDS_SUPPORT: {
    grade: GRADE_LEVELS.PRIMARY_5,
    performanceLevel: 'needs_improvement',
    interests: ['体育', '美术'],
    learningStyle: 'kinesthetic', // 动觉型学习者
  },
} as const;

/**
 * 生成符合项目特点的教师 Mock 数据
 */
export function generateRealisticTeachers(count: number = 10): any[] {
  const departments = [
    'STEM教研部', '机器人教研室', '编程教研室', '人工智能教研室', '创客空间',
    '科学实验部', '工程设计部', '数学思维部', '项目研发部', '课程创新部'
  ];

  const positions = Object.values(TEACHER_POSITIONS);

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `${['张', '李', '王', '赵', '刘', '陈', '杨', '黄'][index % 8]}老师`,
    email: `teacher${index + 1}@school.edu.cn`,
    phone: `138${String(index + 10000000).padStart(8, '0')}`,
    department: departments[index % departments.length],
    position: positions[index % positions.length],
    courseCount: Math.floor(Math.random() * 5) + 2,
    studentCount: Math.floor(Math.random() * 100) + 50,
    status: index === 3 ? 'on_leave' : 'active',
    hireDate: `20${15 + (index % 8)}-09-01`,
    bio: `专注于${departments[index % departments.length]}领域，拥有 ${5 + index} 年STEM教育经验`,
    avatar: '',
    rating: parseFloat((4.0 + Math.random()).toFixed(1)), // 保留一位小数
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * 生成符合项目特点的课程 Mock 数据
 */
export function generateRealisticCourses(count: number = 15): any[] {
  const subjects = Object.values(SUBJECTS);
  const difficulties = Object.values(DIFFICULTY_LEVELS);
  const sourceTypes = Object.values(COURSE_SOURCE_TYPES);

  return Array.from({ length: count }, (_, index) => {
    const subject = subjects[index % subjects.length];
    const difficulty = difficulties[index % difficulties.length];
    const sourceType = sourceTypes[index % sourceTypes.length];

    return {
      id: index + 1,
      org_id: 1,
      title: `${SUBJECT_LABELS[subject]}${['基础', '进阶', '提高', '拓展'][index % 4]}`,
      code: `${subject.toUpperCase()}${String(index + 1).padStart(3, '0')}`,
      subject,
      difficulty,
      source_type: sourceType,
      description: `本课程旨在培养学生的${SUBJECT_LABELS[subject]}核心素养`,
      instructor_name: `${['张', '李', '王'][index % 3]}老师`,
      credit_hours: [32, 48, 64, 72][index % 4],
      total_lessons: [16, 24, 32, 36][index % 4],
      schedule_pattern: Object.values(SCHEDULE_PATTERNS)[index % 4],
      max_students: [30, 40, 50][index % 3],
      enrolled_students: Math.floor(Math.random() * 30) + 10,
      rating: 4.0 + Math.random(),
      status: ['published', 'ongoing', 'completed'][index % 3],
      learning_objectives: [
        `掌握${SUBJECT_LABELS[subject]}基础知识`,
        '培养批判性思维能力',
        '提升实践应用能力',
      ],
      tags: [SUBJECT_LABELS[subject], difficulty, sourceType],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

/**
 * 生成符合项目特点的学生 Mock 数据
 */
export function generateRealisticStudents(count: number = 20): any[] {
  const grades = Object.values(GRADE_LEVELS);
  const statuses = ['active', 'graduated', 'suspended', 'transferred'];
  const performanceLevels = ['excellent', 'good', 'average', 'needs_improvement'];
  const learningStyles = ['visual', 'auditory', 'kinesthetic', 'reading_writing'];

  const surnames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
  const givenNames = ['小明', '小红', '小刚', '小芳', '小强', '小丽', '小伟', '小娟', '小龙', '小梅'];

  return Array.from({ length: count }, (_, index) => {
    const grade = grades[index % grades.length];
    const status = statuses[index % statuses.length];
    const performanceLevel = performanceLevels[index % performanceLevels.length];
    const learningStyle = learningStyles[index % learningStyles.length];

    const surname = surnames[index % surnames.length];
    const givenName = givenNames[index % givenNames.length];
    const name = `${surname}${givenName}`;

    // 根据年级计算入学日期
    const enrollmentYear = 2024 - Math.floor(index / 5);
    const enrollmentDate = `${enrollmentYear}-09-01`;

    return {
      id: index + 1,
      name,
      email: `${name.toLowerCase()}@student.edu.cn`,
      phone: `139${String(index + 10000000).padStart(8, '0')}`,
      grade,
      enrolledCourses: Math.floor(Math.random() * 5) + 1,
      progress: Math.floor(Math.random() * 40) + 60, // 60-100%
      attendanceRate: Math.floor(Math.random() * 20) + 80, // 80-100%
      status,
      parentInfo: {
        name: `${surname}先生/女士`,
        phone: `138${String(index + 10000000).padStart(8, '0')}`,
        relationship: index % 2 === 0 ? '父子' : '母女',
        email: `${surname.toLowerCase()}@parent.com`,
      },
      enrollmentDate,
      graduationDate: status === 'graduated' ? '2026-01-15' : undefined,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      totalPayment: Math.floor(Math.random() * 20000) + 5000,
      performanceLevel,
      learningStyle,
      interests: [['数学', '编程'], ['英语', '音乐'], ['体育', '美术']][index % 3],
      createdAt: new Date(enrollmentDate).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * 生成符合项目特点的教室 Mock 数据
 */
export function generateRealisticClassrooms(count: number = 12): any[] {
  const buildingTypes = ['教学楼A', '教学楼B', '实验楼', '艺术楼'];
  const roomTypes = ['普通教室', '多媒体教室', '实验室', '计算机房', '音乐教室', '美术教室'];
  const equipmentList = [
    ['投影仪', '白板', '音响'],
    ['智能黑板', '空调', '摄像头'],
    ['实验台', '通风柜', '安全设备'],
    ['电脑', '服务器', '网络设备'],
    ['钢琴', '音响', '乐器架'],
    ['画架', '展示墙', '照明设备'],
  ];

  return Array.from({ length: count }, (_, index) => {
    const building = buildingTypes[index % buildingTypes.length];
    const roomType = roomTypes[index % roomTypes.length];
    const floor = Math.floor(index / 4) + 1;
    const roomNumber = (index % 4) + 101;

    return {
      id: index + 1,
      name: `${building}${roomNumber}`,
      capacity: [30, 40, 50, 60][index % 4],
      type: roomType,
      location: `${building} ${floor}楼`,
      equipment: equipmentList[index % equipmentList.length],
      isAvailable: Math.random() > 0.2, // 80% 可用
      facilities: ['空调', 'WiFi', '电源插座'],
      description: `${roomType}，可容纳${[30, 40, 50, 60][index % 4]}人`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * 生成符合项目特点的排课 Mock 数据
 */
export function generateRealisticSchedules(
  classroomCount: number = 12,
  courseCount: number = 15,
  teacherCount: number = 12,
  scheduleCount: number = 30
): any[] {
  const daysOfWeek = [1, 2, 3, 4, 5]; // 1=周一 到 5=周五
  const timeSlots = [
    { start: '08:00', end: '08:45' },
    { start: '09:00', end: '09:45' },
    { start: '10:00', end: '10:45' },
    { start: '11:00', end: '11:45' },
    { start: '14:00', end: '14:45' },
    { start: '15:00', end: '15:45' },
    { start: '16:00', end: '16:45' },
  ];
  const statuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];

  // 课程名称（STEM课程）
  const courseNames = [
    '机器人编程基础', 'AI人工智能入门', 'Python编程进阶', '科学实验探究',
    ' Scratch图形编程', '3D打印创客', '无人机基础', '电子电路',
    '数学思维训练', '物理实验课', '化学探究实验', '生物观察实验'
  ];

  // 教师名称
  const teacherNames = [
    '张老师', '李老师', '王老师', '刘老师', '陈老师', '杨老师',
    '赵老师', '黄老师', '周老师', '吴老师', '郑老师', '孙老师'
  ];

  return Array.from({ length: scheduleCount }, (_, index) => {
    const dayOfWeek = daysOfWeek[index % daysOfWeek.length];
    const timeSlot = timeSlots[index % timeSlots.length];
    const status = statuses[index % statuses.length];
    const courseName = courseNames[index % courseNames.length];
    const teacherName = teacherNames[index % teacherCount];

    // 生成随机的学生 ID 列表（5-25 人）
    const studentCount = Math.floor(Math.random() * 20) + 5;
    const studentIds = Array.from({ length: studentCount }, (_, i) => i + 1);

    return {
      id: index + 1,
      courseId: (index % courseCount) + 1,
      courseName,
      courseCode: `STEM-${String(index + 1).padStart(3, '0')}`,
      courseType: 'STEM课程',
      classroomId: (index % classroomCount) + 1,
      classroomName: `教室${(index % classroomCount) + 1}`,
      teacherId: (index % teacherCount) + 1,
      teacherName,
      dayOfWeek,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      duration: 45,
      status,
      studentIds,
      maxStudents: 40,
      enrolledStudents: studentCount,
      notes: status === 'cancelled' ? '教师请假' : undefined,
      startDate: new Date().toISOString().split('T')[0],
      repeatType: 'weekly',
      repeatWeeks: 16,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * 生成符合项目特点的角色 Mock 数据
 */
export function generateRealisticRoles(): any[] {
  return [
    {
      id: 1,
      name: '校长',
      code: 'principal',
      description: '机构最高管理者，拥有全部权限',
      permissions: [], // 动态生成
      dataScope: 'all',
      isInherited: false,
      userCount: 2,
      isSystem: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: '教务主任',
      code: 'academic_director',
      description: '负责教学管理，拥有教学相关权限',
      permissions: [],
      dataScope: 'department',
      isInherited: false,
      userCount: 5,
      isSystem: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: '教师',
      code: 'teacher',
      description: '一线教师，拥有教学和学员管理权限',
      permissions: [],
      dataScope: 'self',
      isInherited: false,
      userCount: 45,
      isSystem: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      name: '课程顾问',
      code: 'course_consultant',
      description: '负责课程咨询和报名',
      permissions: [],
      dataScope: 'self',
      isInherited: false,
      userCount: 12,
      isSystem: false,
      createdAt: '2025-06-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 5,
      name: '财务人员',
      code: 'finance_staff',
      description: '负责财务管理和收费',
      permissions: [],
      dataScope: 'department',
      isInherited: false,
      userCount: 3,
      isSystem: false,
      createdAt: '2025-06-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
  ];
}

/**
 * 生成权限树
 */
export function generatePermissionTree(): any[] {
  const modules = [
    { code: 'teacher', name: '教师管理' },
    { code: 'student', name: '学员管理' },
    { code: 'schedule', name: '排课管理' },
    { code: 'finance', name: '财务管理' },
    { code: 'classroom', name: '教室管理' },
    { code: 'wechat', name: '微信客服' },
    { code: 'system', name: '系统管理' },
  ];

  const actions = [
    { code: 'view', name: '查看' },
    { code: 'create', name: '创建' },
    { code: 'edit', name: '编辑' },
    { code: 'delete', name: '删除' },
    { code: 'export', name: '导出' },
    { code: 'import', name: '导入' },
  ];

  const permissions: any[] = [];
  let id = 1;

  modules.forEach((module) => {
    const menuPermission: any = {
      id: id++,
      name: `${module.name}模块`,
      code: `${module.code}:menu`,
      type: 'menu',
      module: module.code,
      action: 'view',
      resource: `/${module.code}`,
      children: [],
    };

    // 添加操作权限
    actions.forEach((action) => {
      menuPermission.children.push({
        id: id++,
        name: `${action.name}${module.name}`,
        code: `${module.code}:${action.code}`,
        type: 'button',
        module: module.code,
        action: action.code,
        resource: `/${module.code}`,
        parentId: menuPermission.id,
      });
    });

    // 添加 API 权限
    menuPermission.children.push({
      id: id++,
      name: `${module.name}API 接口`,
      code: `${module.code}:api`,
      type: 'api',
      module: module.code,
      action: '*',
      resource: `/api/v1/${module.code}`,
      parentId: menuPermission.id,
    });

    permissions.push(menuPermission);
  });

  return permissions;
}

/**
 * 生成经营总览 Mock 数据
 */
export function generateBusinessOverview(): any {
  const totalStudents = Math.floor(Math.random() * 500) + 1000; // 1000-1500
  const activeStudents = Math.floor(totalStudents * 0.85); // 85% 活跃
  const totalTeachers = Math.floor(Math.random() * 30) + 50; // 50-80
  const activeTeachers = Math.floor(totalTeachers * 0.9); // 90% 活跃
  const totalCourses = Math.floor(Math.random() * 100) + 100; // 100-200
  const runningCourses = Math.floor(totalCourses * 0.8); // 80% 运行中
  const monthlyRevenue = Math.floor(Math.random() * 300000) + 700000; // 70万-100万
  const yearlyRevenue = monthlyRevenue * 12;

  return {
    totalStudents,
    activeStudents,
    totalTeachers,
    activeTeachers,
    totalCourses,
    runningCourses,
    monthlyRevenue,
    monthlyGrowth: parseFloat((Math.random() * 20 - 5).toFixed(1)), // -5% to 15%
    yearlyRevenue,
    yearlyGrowth: parseFloat((Math.random() * 30 + 10).toFixed(1)), // 10%-40%
    averageClassSize: Math.floor(Math.random() * 10) + 15, // 15-25
    classroomUtilization: parseFloat((Math.random() * 20 + 65).toFixed(1)), // 65%-85%
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 生成预警数据
 */
export function generateDataWarnings(count: number = 5): any[] {
  const warningTypes = [
    { type: 'receivable_overdue', title: '应收款项逾期警告', metric: '待收款金额' },
    { type: 'low_attendance', title: '出勤率偏低警告', metric: '平均出勤率' },
    { type: 'teacher_shortage', title: '教师资源不足', metric: '师生比' },
    { type: 'course_cancellation', title: '课程取消率高', metric: '取消率' },
    { type: 'revenue_decline', title: '收入下降预警', metric: '月收入' },
  ];

  const levels = ['high', 'medium', 'low'];

  return Array.from({ length: count }, (_, index) => {
    const warningType = warningTypes[index % warningTypes.length];
    const level = levels[index % levels.length];

    return {
      id: index + 1,
      type: warningType.type,
      level,
      title: warningType.title,
      message: `${warningType.title}，请关注相关指标`,
      metric: warningType.metric,
      currentValue: Math.floor(Math.random() * 1000),
      thresholdValue: Math.floor(Math.random() * 800),
      suggestedAction: '请及时跟进并采取措施',
      createdAt: new Date().toISOString(),
      isRead: index > 2, // 前 3 条未读
    };
  });
}
