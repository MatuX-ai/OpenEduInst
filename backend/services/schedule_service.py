from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from models.schedule import Schedule, ScheduleStatus
from models.classroom import Classroom

class ScheduleService:
    def __init__(self, db: Session):
        self.db = db

    def check_conflicts(self, teacher_id: int, classroom_id: int, start_time: datetime, end_time: datetime, exclude_schedule_id: int = None) -> bool:
        """
        Check for scheduling conflicts.
        Returns True if there is a conflict, False otherwise.
        """
        query = self.db.query(Schedule).filter(
            Schedule.status != ScheduleStatus.CANCELLED,
            Schedule.start_time < end_time,
            Schedule.end_time > start_time
        )

        # Check teacher conflict
        teacher_conflict = query.filter(Schedule.teacher_id == teacher_id)
        if exclude_schedule_id:
            teacher_conflict = teacher_conflict.filter(Schedule.id != exclude_schedule_id)
        
        if teacher_conflict.first():
            return True

        # Check classroom conflict
        classroom_conflict = query.filter(Schedule.classroom_id == classroom_id)
        if exclude_schedule_id:
            classroom_conflict = classroom_conflict.filter(Schedule.id != exclude_schedule_id)
            
        if classroom_conflict.first():
            return True

        return False

    def generate_recurring_schedules(self, base_schedule: Schedule, recurrence_rule: str, count: int) -> list:
        """
        Generate recurring schedules based on a simple rule.
        For now, supports simple weekly recurrence.
        """
        schedules = []
        current_start = base_schedule.start_time
        duration = base_schedule.end_time - base_schedule.start_time

        for _ in range(count):
            new_start = current_start
            new_end = new_start + duration
            
            if not self.check_conflicts(base_schedule.teacher_id, base_schedule.classroom_id, new_start, new_end):
                new_schedule = Schedule(
                    org_id=base_schedule.org_id,
                    course_id=base_schedule.course_id,
                    teacher_id=base_schedule.teacher_id,
                    classroom_id=base_schedule.classroom_id,
                    start_time=new_start,
                    end_time=new_end,
                    status=ScheduleStatus.DRAFT
                )
                schedules.append(new_schedule)
                self.db.add(new_schedule)
            
            # Simple weekly increment
            current_start += timedelta(weeks=1)

        self.db.commit()
        return schedules
