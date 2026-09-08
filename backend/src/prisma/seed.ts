import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: 'postgresql://postgres:loanpass123@localhost:5432/weekly_report_db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Roles
  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: { name: 'MANAGER' },
  });

  const memberRole = await prisma.role.upsert({
    where: { name: 'TEAM_MEMBER' },
    update: {},
    create: { name: 'TEAM_MEMBER' },
  });

  // Users
  const manager = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      name: 'Sarah Manager',
      email: 'manager@company.com',
      passwordHash: await bcrypt.hash('password123', 10),
      roleId: managerRole.id,
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@company.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@company.com',
      passwordHash: await bcrypt.hash('password123', 10),
      roleId: memberRole.id,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@company.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@company.com',
      passwordHash: await bcrypt.hash('password123', 10),
      roleId: memberRole.id,
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@company.com' },
    update: {},
    create: {
      name: 'Carol White',
      email: 'carol@company.com',
      passwordHash: await bcrypt.hash('password123', 10),
      roleId: memberRole.id,
    },
  });

  // Projects
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-1' },
    update: {},
    create: { id: 'proj-1', name: 'Client A', description: 'Client A project' },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-2' },
    update: {},
    create: { id: 'proj-2', name: 'Internal Tooling', description: 'Internal tools development' },
  });

  const project3 = await prisma.project.upsert({
    where: { id: 'proj-3' },
    update: {},
    create: { id: 'proj-3', name: 'R&D', description: 'Research and development' },
  });

  // Helper function
  const createReport = async (userId: string, projectId: string, weekStart: Date, weekEnd: Date, status: string, versionData: any) => {
    const existing = await prisma.report.findFirst({ where: { userId, weekStart } });
    if (existing) return existing;

    const report = await prisma.report.create({
      data: { userId, projectId, weekStart, weekEnd, status },
    });

    const version = await prisma.reportVersion.create({
      data: {
        reportId: report.id,
        versionNumber: 1,
        notes: versionData.notes,
        links: versionData.links,
        tasks: { create: versionData.tasks },
        plannedTasks: { create: versionData.plannedTasks },
        blockers: { create: versionData.blockers },
        achievements: { create: versionData.achievements },
        hoursBreakdown: { create: versionData.hoursBreakdown },
      },
    });

    await prisma.reportStatusHistory.create({
      data: { reportId: report.id, changedBy: userId, status },
    });

    if (status === 'APPROVED') {
      await prisma.reviewComment.create({
        data: { reportVersionId: version.id, managerId: manager.id, comment: 'Great work this week!' },
      });
    }

    if (status === 'NEEDS_CORRECTION') {
      await prisma.reviewComment.create({
        data: { reportVersionId: version.id, managerId: manager.id, comment: 'Please add more detail to task completion percentages.' },
      });
    }

    return report;
  };

  // Week dates
  const w1Start = new Date('2026-08-25');
  const w1End = new Date('2026-08-29');
  const w2Start = new Date('2026-09-01');
  const w2End = new Date('2026-09-05');

  // Alice reports
  await createReport(alice.id, project1.id, w1Start, w1End, 'APPROVED', {
    notes: 'Productive week overall.',
    links: 'https://github.com/alice/project-a',
    tasks: [
      { name: 'API Integration', priority: 'HIGH', plannedPct: 100, actualPct: 95, status: 'Completed', timePlanned: 8, timeSpent: 9, deliverable: 'REST API endpoints' },
      { name: 'Unit Tests', priority: 'MEDIUM', plannedPct: 80, actualPct: 70, status: 'In Progress', timePlanned: 4, timeSpent: 3, deliverable: 'Test coverage report' },
    ],
    plannedTasks: [
      { taskName: 'Frontend Integration', priority: 'HIGH', description: 'Connect API to React components' },
      { taskName: 'Code Review', priority: 'MEDIUM', description: 'Review team PRs' },
    ],
    blockers: [
      { description: 'Third party API rate limiting causing delays', isKeyIssue: true },
    ],
    achievements: [
      { description: 'Completed API integration ahead of schedule', isKeyAchievement: true },
    ],
    hoursBreakdown: [
      { taskType: 'Development', hours: 28 },
      { taskType: 'Testing', hours: 6 },
      { taskType: 'Meetings', hours: 4 },
      { taskType: 'Documentation', hours: 2 },
    ],
  });

  await createReport(alice.id, project1.id, w2Start, w2End, 'SUBMITTED', {
    notes: 'Working on frontend integration this week.',
    links: '',
    tasks: [
      { name: 'Frontend Integration', priority: 'HIGH', plannedPct: 100, actualPct: 80, status: 'In Progress', timePlanned: 16, timeSpent: 14, deliverable: 'Connected components' },
    ],
    plannedTasks: [
      { taskName: 'Testing & QA', priority: 'HIGH', description: 'Full system testing' },
    ],
    blockers: [],
    achievements: [
      { description: 'Reduced API response time by 40%', isKeyAchievement: true },
    ],
    hoursBreakdown: [
      { taskType: 'Development', hours: 30 },
      { taskType: 'Meetings', hours: 5 },
      { taskType: 'Testing', hours: 5 },
    ],
  });

  // Bob reports
  await createReport(bob.id, project2.id, w1Start, w1End, 'APPROVED', {
    notes: 'Good progress on internal tooling.',
    links: '',
    tasks: [
      { name: 'Dashboard UI', priority: 'HIGH', plannedPct: 100, actualPct: 100, status: 'Completed', timePlanned: 12, timeSpent: 11, deliverable: 'Dashboard prototype' },
      { name: 'Database Schema', priority: 'HIGH', plannedPct: 100, actualPct: 90, status: 'Completed', timePlanned: 8, timeSpent: 9, deliverable: 'Updated schema' },
    ],
    plannedTasks: [
      { taskName: 'Backend API', priority: 'HIGH', description: 'Build REST endpoints' },
    ],
    blockers: [
      { description: 'Unclear requirements for reporting module', isKeyIssue: true },
    ],
    achievements: [
      { description: 'Dashboard UI completed and approved by stakeholders', isKeyAchievement: true },
    ],
    hoursBreakdown: [
      { taskType: 'Development', hours: 25 },
      { taskType: 'Design', hours: 8 },
      { taskType: 'Meetings', hours: 5 },
      { taskType: 'Documentation', hours: 2 },
    ],
  });

  await createReport(bob.id, project2.id, w2Start, w2End, 'NEEDS_CORRECTION', {
    notes: 'Started backend development.',
    links: '',
    tasks: [
      { name: 'REST API', priority: 'HIGH', plannedPct: 80, actualPct: 60, status: 'In Progress', timePlanned: 20, timeSpent: 18, deliverable: 'Partial API' },
    ],
    plannedTasks: [
      { taskName: 'Complete API', priority: 'HIGH', description: 'Finish remaining endpoints' },
    ],
    blockers: [
      { description: 'Dependency conflict with existing packages', isKeyIssue: false },
    ],
    achievements: [],
    hoursBreakdown: [
      { taskType: 'Development', hours: 32 },
      { taskType: 'Meetings', hours: 6 },
    ],
  });

  // Carol reports
  await createReport(carol.id, project3.id, w1Start, w1End, 'APPROVED', {
    notes: 'R&D sprint completed successfully.',
    links: 'https://docs.google.com/research-notes',
    tasks: [
      { name: 'Research Analysis', priority: 'HIGH', plannedPct: 100, actualPct: 100, status: 'Completed', timePlanned: 16, timeSpent: 15, deliverable: 'Research report' },
      { name: 'Prototype', priority: 'MEDIUM', plannedPct: 60, actualPct: 50, status: 'In Progress', timePlanned: 10, timeSpent: 8, deliverable: 'Initial prototype' },
    ],
    plannedTasks: [
      { taskName: 'Prototype v2', priority: 'HIGH', description: 'Iterate based on feedback' },
      { taskName: 'Presentation', priority: 'MEDIUM', description: 'Prepare findings presentation' },
    ],
    blockers: [],
    achievements: [
      { description: 'Research findings validated by external expert', isKeyAchievement: true },
    ],
    hoursBreakdown: [
      { taskType: 'Development', hours: 15 },
      { taskType: 'Documentation', hours: 10 },
      { taskType: 'Meetings', hours: 8 },
      { taskType: 'Testing', hours: 7 },
    ],
  });

  await createReport(carol.id, project3.id, w2Start, w2End, 'DRAFT', {
    notes: '',
    links: '',
    tasks: [],
    plannedTasks: [],
    blockers: [],
    achievements: [],
    hoursBreakdown: [],
  });

  console.log('✅ Seed complete!');
  console.log('Manager:', manager.email);
  console.log('Members:', alice.email, bob.email, carol.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());