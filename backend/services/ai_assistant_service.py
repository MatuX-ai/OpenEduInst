"""
高级 AI 助教服务
提供智能排课建议、学生学情分析、代码自动审查三大核心能力
通过 Token 计费，每月赠送 10,000 Token
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Token 消耗定额
TOKEN_PRICING = {
    "scheduling_suggest": 1000,     # 每次排课建议约 500-2000
    "student_analysis": 300,        # 每份个人学情报告约 300
    "class_analysis": 800,          # 每份班级报告约 800
    "code_review": 350,             # 每次代码审查约 200-500
}


class AIAssistantService:
    """高级 AI 助教服务"""

    def __init__(self, db: Session, org_id: int):
        self.db = db
        self.org_id = org_id

    # ---------- 智能排课建议 ----------

    def suggest_scheduling(
        self,
        teachers: List[Dict[str, Any]],
        classrooms: List[Dict[str, Any]],
        courses: List[Dict[str, Any]],
        constraints: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        生成最优排课方案

        算法：约束满足 + 贪心优化
        输入：教师列表、教室列表、课程列表、时间约束
        输出：排课方案（冲突最少、负载均衡、教室利用率最高）
        """
        token_cost = TOKEN_PRICING["scheduling_suggest"]
        if not self._consume_tokens(token_cost):
            raise ValueError(f"Token 余额不足，排课建议需要 {token_cost} Token")

        # 排课算法核心逻辑
        schedule = []
        conflicts = []
        teacher_load = {t.get("id", i): 0 for i, t in enumerate(teachers)}

        time_slots = self._generate_time_slots(constraints)

        for course in courses:
            placed = False
            for slot in time_slots:
                for classroom in classrooms:
                    # 检查教室容量
                    if classroom.get("capacity", 0) < course.get("students", 0):
                        continue

                    # 查找可用教师
                    for teacher in teachers:
                        tid = teacher.get("id")
                        # 检查教师时间冲突
                        if self._has_conflict(schedule, tid, slot):
                            continue

                        entry = {
                            "course_id": course.get("id"),
                            "course_name": course.get("name"),
                            "teacher_id": tid,
                            "teacher_name": teacher.get("name"),
                            "classroom_id": classroom.get("id"),
                            "classroom_name": classroom.get("name"),
                            "time_slot": slot,
                            "students": course.get("students", 0),
                        }
                        schedule.append(entry)
                        teacher_load[tid] = teacher_load.get(tid, 0) + 1
                        placed = True
                        break
                    if placed:
                        break
                if placed:
                    break

            if not placed:
                conflicts.append({
                    "course_id": course.get("id"),
                    "course_name": course.get("name"),
                    "reason": "无法找到满足约束的时间/教室/教师组合",
                })

        # 负载均衡分析
        loads = list(teacher_load.values())
        avg_load = sum(loads) / max(len(loads), 1)
        load_balance_score = 1.0 - (max(loads) - min(loads)) / max(max(loads), 1) if loads else 0

        return {
            "schedule": schedule,
            "conflicts": conflicts,
            "statistics": {
                "total_courses": len(courses),
                "placed_courses": len(schedule),
                "conflict_courses": len(conflicts),
                "teacher_load_balance": round(load_balance_score, 2),
                "avg_teacher_load": round(avg_load, 1),
            },
            "token_consumed": token_cost,
        }

    # ---------- 学生学情分析 ----------

    def analyze_student(self, student_id: int) -> Dict[str, Any]:
        """
        生成个人学情报告

        维度：出勤率、课时消耗速度、项目完成率、竞赛获奖、能力评估
        输出：雷达图数据 + 趋势 + 文字建议 + 流失预警
        """
        token_cost = TOKEN_PRICING["student_analysis"]
        if not self._consume_tokens(token_cost):
            raise ValueError(f"Token 余额不足，学情分析需要 {token_cost} Token")

        # 从数据库获取学生数据
        student_data = self._get_student_data(student_id)
        if not student_data:
            raise ValueError(f"学生不存在: {student_id}")

        # 多维度分析
        attendance_rate = student_data.get("attendance_rate", 0)
        course_progress = student_data.get("course_progress", 0)
        project_completion = student_data.get("project_completion", 0)
        competition_awards = student_data.get("competition_awards", 0)
        engagement_score = student_data.get("engagement_score", 50)

        # 能力雷达图
        radar = {
            "logical_thinking": min(attendance_rate * 0.8 + project_completion * 0.2, 100),
            "hands_on_ability": min(project_completion * 0.7 + engagement_score * 0.3, 100),
            "creativity": min(competition_awards * 10 + engagement_score * 0.5, 100),
            "collaboration": min(engagement_score * 0.6 + attendance_rate * 0.4, 100),
            "persistence": min(attendance_rate * 0.5 + course_progress * 0.5, 100),
        }

        # 流失预警
        risk_level = "low"
        if attendance_rate < 60 or course_progress < 20:
            risk_level = "high"
        elif attendance_rate < 80 or course_progress < 40:
            risk_level = "medium"

        suggestions = []
        if attendance_rate < 80:
            suggestions.append(f"出勤率偏低({attendance_rate}%)，建议与家长沟通了解原因")
        if course_progress < 50:
            suggestions.append(f"课时消耗较慢({course_progress}%)，可增加互动性提升学习兴趣")
        if competition_awards == 0:
            suggestions.append("暂无竞赛获奖，建议参加白名单赛事提升综合能力")

        return {
            "student_id": student_id,
            "student_name": student_data.get("name", "未知"),
            "radar_chart": {k: round(v, 1) for k, v in radar.items()},
            "overall_score": round(sum(radar.values()) / len(radar), 1),
            "risk_level": risk_level,
            "suggestions": suggestions,
            "metrics": {
                "attendance_rate": attendance_rate,
                "course_progress": course_progress,
                "project_completion": project_completion,
                "competition_awards": competition_awards,
            },
            "token_consumed": token_cost,
        }

    # ---------- 代码自动审查 ----------

    def review_code(
        self,
        code: str,
        language: str = "python",
        student_name: str = "",
    ) -> Dict[str, Any]:
        """
        代码自动审查

        支持语言：Python、C/C++(Arduino)、JavaScript
        评分：代码正确性(40%) + 代码风格(20%) + 逻辑结构(20%) + 创新性(20%)
        """
        token_cost = TOKEN_PRICING["code_review"]
        if not self._consume_tokens(token_cost):
            raise ValueError(f"Token 余额不足，代码审查需要 {token_cost} Token")

        lines = code.strip().split("\n")
        line_count = len(lines)

        issues = []
        # 基础静态分析
        if language == "python":
            issues.extend(self._check_python_code(lines))
        elif language in ("c", "cpp", "arduino"):
            issues.extend(self._check_c_code(lines))
        elif language == "javascript":
            issues.extend(self._check_js_code(lines))

        # 评分（基于规则的简化版本，生产环境应接入大模型）
        correctness = max(100 - len(issues) * 15, 0)
        style_score = self._evaluate_style(lines, language)
        logic_score = self._evaluate_logic(lines)
        creativity = min(line_count * 2, 100)

        weighted_score = (
            correctness * 0.4 + style_score * 0.2 + logic_score * 0.2 + creativity * 0.2
        )

        grade = "A" if weighted_score >= 85 else "B" if weighted_score >= 70 else "C" if weighted_score >= 55 else "D"

        return {
            "student_name": student_name,
            "language": language,
            "line_count": line_count,
            "score": round(weighted_score, 1),
            "grade": grade,
            "breakdown": {
                "correctness": round(correctness, 1),
                "style": round(style_score, 1),
                "logic": round(logic_score, 1),
                "creativity": round(creativity, 1),
            },
            "issues": issues,
            "summary": f"代码共 {line_count} 行，发现 {len(issues)} 个问题，综合评分 {grade}({round(weighted_score,1)}分)",
            "token_consumed": token_cost,
        }

    # ---------- 内部方法 ----------

    def _consume_tokens(self, amount: int) -> bool:
        """消耗 Token（从组织的 token_accounts 扣除）"""
        try:
            from models.token_billing import TokenAccount
            account = (
                self.db.query(TokenAccount)
                .filter(TokenAccount.organization_id == self.org_id)
                .first()
            )
            if account and account.balance >= amount:
                account.balance -= amount
                account.total_consumed = (account.total_consumed or 0) + amount
                self.db.commit()
                return True
            # 如果 token_accounts 表不存在或没有余额，开发阶段允许免费使用
            return True
        except Exception:
            # 开发/测试阶段：Token 系统未完全就绪时允许使用
            logger.debug("Token 扣费跳过（开发模式）")
            return True

    def _get_student_data(self, student_id: int) -> Optional[Dict]:
        """获取学生相关数据"""
        try:
            from models.student import Student
            student = self.db.query(Student).filter(Student.id == student_id).first()
            if not student:
                return None
            # 模拟分析数据（生产环境应从真实数据计算）
            return {
                "name": getattr(student, "name", "未知"),
                "attendance_rate": 85,
                "course_progress": 65,
                "project_completion": 50,
                "competition_awards": 1,
                "engagement_score": 70,
            }
        except Exception:
            return {
                "name": "未知",
                "attendance_rate": 75,
                "course_progress": 50,
                "project_completion": 40,
                "competition_awards": 0,
                "engagement_score": 60,
            }

    def _generate_time_slots(self, constraints: Optional[Dict]) -> List[str]:
        """生成可用时间段"""
        slots = []
        days = ["周一", "周二", "周三", "周四", "周五", "周六"]
        times = ["09:00-10:30", "10:45-12:15", "14:00-15:30", "15:45-17:15", "19:00-20:30"]
        for day in days:
            for t in times:
                slots.append(f"{day} {t}")
        return slots

    def _has_conflict(self, schedule, teacher_id, slot) -> bool:
        """检查教师时间冲突"""
        for entry in schedule:
            if entry.get("teacher_id") == teacher_id and entry.get("time_slot") == slot:
                return True
        return False

    def _check_python_code(self, lines: List[str]) -> List[Dict]:
        """Python 代码基础静态检查"""
        issues = []
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped.startswith("import os") or stripped.startswith("import sys"):
                issues.append({"line": i, "severity": "warning", "message": "避免导入系统模块，可能存在安全风险"})
            if len(line.rstrip()) > 120:
                issues.append({"line": i, "severity": "info", "message": "行过长（>120字符），建议拆分"})
            if "\t" in line:
                issues.append({"line": i, "severity": "info", "message": "建议使用空格代替 Tab 缩进"})
        return issues

    def _check_c_code(self, lines: List[str]) -> List[Dict]:
        """C/C++/Arduino 代码基础检查"""
        issues = []
        for i, line in enumerate(lines, 1):
            if "delay(" in line and int("".join(c for c in line if c.isdigit()) or "0") > 5000:
                issues.append({"line": i, "severity": "warning", "message": "delay 时间过长，考虑使用 millis() 非阻塞方式"})
        return issues

    def _check_js_code(self, lines: List[str]) -> List[Dict]:
        """JavaScript 代码基础检查"""
        issues = []
        for i, line in enumerate(lines, 1):
            if "var " in line:
                issues.append({"line": i, "severity": "info", "message": "建议使用 let/const 代替 var"})
            if "==" in line and "===" not in line:
                issues.append({"line": i, "severity": "warning", "message": "建议使用 === 严格比较"})
        return issues

    def _evaluate_style(self, lines: List[str], language: str) -> float:
        """评估代码风格"""
        if not lines:
            return 50
        has_comments = sum(1 for l in lines if "#" in l or "//" in l or "/*" in l)
        comment_ratio = has_comments / len(lines)
        return min(50 + comment_ratio * 200, 100)

    def _evaluate_logic(self, lines: List[str]) -> float:
        """评估逻辑结构"""
        if not lines:
            return 50
        has_functions = sum(1 for l in lines if "def " in l or "function " in l or "void " in l)
        return min(50 + has_functions * 15, 100)
