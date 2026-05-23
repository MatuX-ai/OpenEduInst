export interface UnifiedCourse {
  id: number;
  title: string;
  description?: string;
  instructor_name?: string;
  institution?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}
