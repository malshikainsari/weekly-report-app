export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Task {
  id?: string;
  name: string;
  priority: string;
  plannedPct: number;
  actualPct: number;
  status: string;
  timePlanned: number;
  timeSpent: number;
  deliverable?: string;
}

export interface PlannedTask {
  id?: string;
  taskName: string;
  priority?: string;
  description?: string;
}

export interface Blocker {
  id?: string;
  description: string;
  isKeyIssue: boolean;
}

export interface Achievement {
  id?: string;
  description: string;
  isKeyAchievement: boolean;
}

export interface HoursBreakdown {
  id?: string;
  taskType: string;
  hours: number;
}

export interface ReportVersion {
  id: string;
  versionNumber: number;
  notes?: string;
  links?: string;
  submittedAt: string;
  tasks: Task[];
  plannedTasks: PlannedTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  hoursBreakdown: HoursBreakdown[];
  reviewComments: ReviewComment[];
}

export interface Report {
  id: string;
  userId: string;
  projectId?: string;
  weekStart: string;
  weekEnd: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
  user?: User;
  project?: Project;
  versions: ReportVersion[];
}

export interface ReviewComment {
  id: string;
  comment: string;
  createdAt: string;
  manager: User;
}