-- ============================================
-- OpenMT Demo 数据种子脚本
-- 为 4 种组织类型创建完整的演示数据
-- ============================================

-- 清理现有演示数据（谨慎执行）
-- DELETE FROM module_rental_records;
-- DELETE FROM user_licenses;
-- DELETE FROM licenses;
-- DELETE FROM classrooms;
-- DELETE FROM users;
-- DELETE FROM organizations;

-- ============================================
-- 1. 星海机器人培训中心（STEM 培训机构）
-- ============================================

INSERT INTO organizations (name, type, contact_email, phone, address, max_users, is_active)
VALUES 
('星海机器人培训中心', 'training_center', 'admin@starrobotics.edu.cn', '010-88886666', '北京市海淀区中关村大街1号', 500, true);

-- 获取刚插入的组织 ID（假设返回 org_id = 1）
SET @org_id_training = LAST_INSERT_ID();

-- 创建教室/实验室
INSERT INTO classrooms (organization_id, name, room_type, capacity, has_projector, has_audio_system, description)
VALUES 
(@org_id_training, 'Arduino 实验室 A', 'lab', 30, true, true, '配备 30 套 Arduino 开发套件'),
(@org_id_training, '机器人竞赛室', 'lab', 20, true, true, 'FLL/VEX 机器人训练场地'),
(@org_id_training, '3D 打印工坊', 'makerspace', 15, false, false, '3 台 3D 打印机，激光切割机 1 台'),
(@org_id_training, 'Python 编程教室', 'classroom', 40, true, true, '多媒体编程教学教室'),
(@org_id_training, '物联网实验室', 'lab', 25, true, true, 'Raspberry Pi + 传感器实验区');

-- 创建教师（STEM 专长）
INSERT INTO users (username, email, password_hash, role, organization_id, full_name, phone, is_active)
VALUES 
('zhang_teacher', 'zhang@starrobotics.edu.cn', '$2b$12$...', 'teacher', @org_id_training, '张明华', '13800138001', true),
('li_python', 'li@starrobotics.edu.cn', '$2b$12$...', 'teacher', @org_id_training, '李思远', '13800138002', true),
('wang_robot', 'wang@starrobotics.edu.cn', '$2b$12$...', 'teacher', @org_id_training, '王建国', '13800138003', true),
('chen_iot', 'chen@starrobotics.edu.cn', '$2b$12$...', 'teacher', @org_id_training, '陈志强', '13800138004', true),
('zhao_admin', 'zhao@starrobotics.edu.cn', '$2b$12$...', 'org_admin', @org_id_training, '赵敏', '13800138005', true);

-- 创建学生（示例 10 人）
INSERT INTO users (username, email, password_hash, role, organization_id, full_name, phone, is_active)
VALUES 
('student_001', 's001@student.local', '$2b$12$...', 'user', @org_id_training, '刘小明', '', true),
('student_002', 's002@student.local', '$2b$12$...', 'user', @org_id_training, '陈小红', '', true),
('student_003', 's003@student.local', '$2b$12$...', 'user', @org_id_training, '王大伟', '', true),
('student_004', 's004@student.local', '$2b$12$...', 'user', @org_id_training, '张美丽', '', true),
('student_005', 's005@student.local', '$2b$12$...', 'user', @org_id_training, '李小龙', '', true),
('student_006', 's006@student.local', '$2b$12$...', 'user', @org_id_training, '赵小芳', '', true),
('student_007', 's007@student.local', '$2b$12$...', 'user', @org_id_training, '孙小强', '', true),
('student_008', 's008@student.local', '$2b$12$...', 'user', @org_id_training, '周小丽', '', true),
('student_009', 's009@student.local', '$2b$12$...', 'user', @org_id_training, '吴小刚', '', true),
('student_010', 's010@student.local', '$2b$12$...', 'user', @org_id_training, '郑小燕', '', true);

-- 创建许可证（教育版）
INSERT INTO licenses (license_key, license_type, organization_id, max_users, valid_from, valid_until, is_active)
VALUES 
('DEMO-TRAINING-2026-001', 'education', @org_id_training, 500, '2026-01-01', '2026-12-31', true);

SET @license_id_training = LAST_INSERT_ID();

-- 分配用户许可证
INSERT INTO user_licenses (user_id, license_id, role, status, can_manage, can_view, can_use, assigned_at)
SELECT id, @license_id_training, 'org_admin', 'active', true, true, true, NOW()
FROM users WHERE username = 'zhao_admin' AND organization_id = @org_id_training;

INSERT INTO user_licenses (user_id, license_id, role, status, can_manage, can_view, can_use, assigned_at)
SELECT id, @license_id_training, 'user', 'active', false, true, true, NOW()
FROM users WHERE organization_id = @org_id_training AND role IN ('teacher', 'user');

-- 创建 Token 套餐
INSERT INTO token_packages (name, package_type, token_count, price, valid_days, bonus_features, is_active)
VALUES 
('STEM 教育标准包', 'standard', 1000, 299.00, 365, '["AI 助教", "智能评测"]', true),
('STEM 教育高级包', 'premium', 5000, 999.00, 365, '["AI 助教", "智能评测", "课程生成", "代码审查"]', true);

-- 为用户创建 Token 余额
INSERT INTO user_token_balances (user_id, total_tokens, used_tokens, remaining_tokens, monthly_bonus_tokens)
SELECT id, 1000, 150, 850, 100
FROM users WHERE username = 'zhao_admin';

-- ============================================
-- 2. XX 实验小学科创中心（K12 学校）
-- ============================================

INSERT INTO organizations (name, type, contact_email, phone, address, max_users, is_active)
VALUES 
('XX 实验小学科创中心', 'k12_school', 'kechuang@xxprimary.edu.cn', '021-66668888', '上海市浦东新区世纪大道100号', 1000, true);

SET @org_id_k12 = LAST_INSERT_ID();

-- 创客空间设备
INSERT INTO classrooms (organization_id, name, room_type, capacity, has_projector, has_audio_system, description)
VALUES 
(@org_id_k12, '3D 打印实验室', 'makerspace', 20, false, false, '5 台 Ultimaker S3 3D 打印机'),
(@org_id_k12, '激光切割工坊', 'makerspace', 15, false, false, '2 台 Glowforge Pro 激光切割机'),
(@org_id_k12, 'Micro:bit 教室', 'lab', 40, true, true, '60 套 Micro:bit 开发板'),
(@org_id_k12, 'VR 体验室', 'lab', 10, true, true, '10 台 Oculus Quest 2'),
(@org_id_k12, '科学实验数据分析室', 'lab', 30, true, true, '传感器数据采集与分析');

-- 教师团队
INSERT INTO users (username, email, password_hash, role, organization_id, full_name, phone, is_active)
VALUES 
('teacher_k12_01', 't01@xxprimary.edu.cn', '$2b$12$...', 'teacher', @org_id_k12, '林老师', '13900139001', true),
('teacher_k12_02', 't02@xxprimary.edu.cn', '$2b$12$...', 'teacher', @org_id_k12, '黄老师', '13900139002', true),
('teacher_k12_03', 't03@xxprimary.edu.cn', '$2b$12$...', 'teacher', @org_id_k12, '徐老师', '13900139003', true),
('admin_k12', 'admin@xxprimary.edu.cn', '$2b$12$...', 'org_admin', @org_id_k12, '杨主任', '13900139004', true);

-- 学生（示例 20 人，3-6 年级）
INSERT INTO users (username, email, password_hash, role, organization_id, full_name, phone, is_active)
VALUES 
('k12_s001', 'ks001@student.local', '$2b$12$...', 'user', @org_id_k12, '张小伟', '', true),
('k12_s002', 'ks002@student.local', '$2b$12$...', 'user', @org_id_k12, '李小芳', '', true),
('k12_s003', 'ks003@student.local', '$2b$12$...', 'user', @org_id_k12, '王小强', '', true),
('k12_s004', 'ks004@student.local', '$2b$12$...', 'user', @org_id_k12, '陈小丽', '', true),
('k12_s005', 'ks005@student.local', '$2b$12$...', 'user', @org_id_k12, '刘小刚', '', true);

-- 许可证
INSERT INTO licenses (license_key, license_type, organization_id, max_users, valid_from, valid_until, is_active)
VALUES 
('DEMO-K12-2026-001', 'education', @org_id_k12, 1000, '2026-01-01', '2026-12-31', true);

SET @license_id_k12 = LAST_INSERT_ID();

-- ============================================
-- 3. XX 职业技术学院实训基地（职业学校）
-- ============================================

INSERT INTO organizations (name, type, contact_email, phone, address, max_users, is_active)
VALUES 
('XX 职业技术学院实训基地', 'vocational', 'shixun@xxvocational.edu.cn', '020-88889999', '广州市天河区高校路200号', 500, true);

SET @org_id_vocational = LAST_INSERT_ID();

-- 实训设备
INSERT INTO classrooms (organization_id, name, room_type, capacity, has_projector, has_audio_system, description)
VALUES 
(@org_id_vocational, 'PLC 控制实验室', 'lab', 20, true, true, '10 套西门子 S7-1200 PLC'),
(@org_id_vocational, 'CNC 加工车间', 'workshop', 10, false, false, '3 台三轴数控铣床'),
(@org_id_vocational, '工业机器人实训室', 'lab', 15, true, true, '2 台 ABB IRB 120 机器人'),
(@org_id_vocational, '嵌入式开发实验室', 'lab', 30, true, true, 'STM32/ESP32 开发板 30 套'),
(@org_id_vocational, '工业自动化仿真室', 'lab', 25, true, true, 'Factory IO 仿真软件');

-- 教师（具备行业资质）
INSERT INTO users (username, email, password_hash, role, organization_id, full_name, phone, is_active)
VALUES 
('prof_plc', 'plc@xxvocational.edu.cn', '$2b$12$...', 'teacher', @org_id_vocational, '周教授', '13700137001', true),
('prof_cnc', 'cnc@xxvocational.edu.cn', '$2b$12$...', 'teacher', @org_id_vocational, '吴工程师', '13700137002', true),
('prof_robot', 'robot@xxvocational.edu.cn', '$2b$12$...', 'teacher', @org_id_vocational, '郑技师', '13700137003', true),
('director_voc', 'director@xxvocational.edu.cn', '$2b$12$...', 'org_admin', @org_id_vocational, '马主任', '13700137004', true);

-- 学生（示例 15 人）
INSERT INTO users (username, email, password_hash, role, organization_id, full_name, phone, is_active)
VALUES 
('voc_s001', 'vs001@student.local', '$2b$12$...', 'user', @org_id_vocational, '何小明', '', true),
('voc_s002', 'vs002@student.local', '$2b$12$...', 'user', @org_id_vocational, '高小红', '', true),
('voc_s003', 'vs003@student.local', '$2b$12$...', 'user', @org_id_vocational, '梁大伟', '', true);

-- 许可证（企业版）
INSERT INTO licenses (license_key, license_type, organization_id, max_users, valid_from, valid_until, is_active)
VALUES 
('DEMO-VOCATIONAL-2026-001', 'enterprise', @org_id_vocational, 500, '2026-01-01', '2026-12-31', true);

SET @license_id_vocational = LAST_INSERT_ID();

-- ============================================
-- 4. XX 区教育局科创监管平台（教育局）
-- ============================================

INSERT INTO organizations (name, type, contact_email, phone, address, max_users, is_active)
VALUES 
('XX 区教育局科创监管平台', 'education_bureau', 'kechuang@xxedu.gov.cn', '0755-28886666', '深圳市福田区福中三路100号', 2000, true);

SET @org_id_bureau = LAST_INSERT_ID();

-- 监管办公室
INSERT INTO classrooms (organization_id, name, room_type, capacity, has_projector, has_audio_system, description)
VALUES 
(@org_id_bureau, '数据统计中心', 'office', 10, true, true, '全区 STEM 教育数据大屏'),
(@org_id_bureau, '资源调配会议室', 'meeting', 20, true, true, '跨校设备共享协调会议'),
(@org_id_bureau, '师资培训教室', 'classroom', 50, true, true, 'STEM 教师培训基地');

-- 管理人员
INSERT INTO users (username, email, password_hash, role, organization_id, full_name, phone, is_active)
VALUES 
('bureau_director', 'director@xxedu.gov.cn', '$2b$12$...', 'org_admin', @org_id_bureau, '钱局长', '13600136001', true),
('bureau_analyst', 'analyst@xxedu.gov.cn', '$2b$12$...', 'teacher', @org_id_bureau, '孙分析师', '13600136002', true),
('bureau_coordinator', 'coord@xxedu.gov.cn', '$2b$12$...', 'teacher', @org_id_bureau, '李协调员', '13600136003', true);

-- 许可证（企业版）
INSERT INTO licenses (license_key, license_type, organization_id, max_users, valid_from, valid_until, is_active)
VALUES 
('DEMO-BUREAU-2026-001', 'enterprise', @org_id_bureau, 2000, '2026-01-01', '2026-12-31', true);

SET @license_id_bureau = LAST_INSERT_ID();

-- ============================================
-- 演示数据说明
-- ============================================

/*
演示账号登录信息（密码统一为：demo123456）

1. 星海机器人培训中心
   - 管理员：zhao_admin / demo123456
   - 教师：zhang_teacher / demo123456
   - 学生：student_001 / demo123456

2. XX 实验小学科创中心
   - 管理员：admin_k12 / demo123456
   - 教师：teacher_k12_01 / demo123456
   - 学生：k12_s001 / demo123456

3. XX 职业技术学院实训基地
   - 管理员：director_voc / demo123456
   - 教师：prof_plc / demo123456
   - 学生：voc_s001 / demo123456

4. XX 区教育局科创监管平台
   - 管理员：bureau_director / demo123456
   - 分析师：bureau_analyst / demo123456

注意事项：
1. 所有密码需要使用 bcrypt 加密后存入数据库
2. 实际部署时，应使用 Python 脚本生成正确的 password_hash
3. 演示环境应设置为只读模式，禁止修改数据
4. 每天凌晨 3:00 自动重置数据到初始状态
*/

-- ============================================
-- 验证数据插入
-- ============================================

SELECT 
    o.name AS organization_name,
    o.type AS organization_type,
    COUNT(DISTINCT c.id) AS classroom_count,
    COUNT(DISTINCT u.id) AS user_count,
    COUNT(DISTINCT l.id) AS license_count
FROM organizations o
LEFT JOIN classrooms c ON o.id = c.organization_id
LEFT JOIN users u ON o.id = u.organization_id
LEFT JOIN licenses l ON o.id = l.organization_id
WHERE o.name LIKE '%STEM%' OR o.name LIKE '%科创%' OR o.name LIKE '%实训%' OR o.name LIKE '%监管%'
GROUP BY o.id, o.name, o.type;
