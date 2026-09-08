import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createReport(userId: string, data: any) {
    const existing = await this.prisma.report.findFirst({
      where: { userId, weekStart: new Date(data.weekStart) },
    });
    if (existing) throw new ForbiddenException('Report for this week already exists');

    return this.prisma.report.create({
      data: {
        userId,
        projectId: data.projectId,
        weekStart: new Date(data.weekStart),
        weekEnd: new Date(data.weekEnd),
        status: 'DRAFT',
      },
      include: { user: true, project: true, versions: true },
    });
  }

  async getMyReports(userId: string) {
    return this.prisma.report.findMany({
      where: { userId },
      include: { project: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      orderBy: { weekStart: 'desc' },
    });
  }

  async getAllReports(filters: any) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status;
    if (filters.weekStart) where.weekStart = { gte: new Date(filters.weekStart) };
    if (filters.weekEnd) where.weekEnd = { lte: new Date(filters.weekEnd) };

    return this.prisma.report.findMany({
      where,
      include: {
        user: { include: { role: true } },
        project: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
      orderBy: { weekStart: 'desc' },
    });
  }

  async getReportById(id: string, userId?: string, isManager?: boolean) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
        versions: {
          orderBy: { versionNumber: 'asc' },
          include: {
            tasks: true,
            plannedTasks: true,
            blockers: true,
            achievements: true,
            hoursBreakdown: true,
            reviewComments: { include: { manager: true } },
          },
        },
        statusHistory: { orderBy: { createdAt: 'asc' }, include: { user: true } },
      },
    });

    if (!report) throw new NotFoundException('Report not found');
    if (!isManager && report.userId !== userId) throw new ForbiddenException('Access denied');

    return report;
  }

  async submitReport(reportId: string, userId: string, versionData: any) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.userId !== userId) throw new ForbiddenException('Access denied');
    if (!['DRAFT', 'NEEDS_CORRECTION'].includes(report.status)) {
      throw new ForbiddenException('Report cannot be submitted in current status');
    }

    const lastVersion = await this.prisma.reportVersion.findFirst({
      where: { reportId },
      orderBy: { versionNumber: 'desc' },
    });
    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const version = await this.prisma.reportVersion.create({
      data: {
        reportId,
        versionNumber,
        notes: versionData.notes,
        links: versionData.links,
        tasks: { create: versionData.tasks || [] },
        plannedTasks: { create: versionData.plannedTasks || [] },
        blockers: { create: versionData.blockers || [] },
        achievements: { create: versionData.achievements || [] },
        hoursBreakdown: { create: versionData.hoursBreakdown || [] },
      },
    });

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'SUBMITTED' },
    });

    await this.prisma.reportStatusHistory.create({
      data: { reportId, changedBy: userId, status: 'SUBMITTED' },
    });

    return version;
  }

  async reviewReport(reportId: string, managerId: string, action: string, comment?: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'SUBMITTED') throw new ForbiddenException('Report is not submitted');

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'NEEDS_CORRECTION';

    if (comment && report.versions[0]) {
      await this.prisma.reviewComment.create({
        data: {
          reportVersionId: report.versions[0].id,
          managerId,
          comment,
        },
      });
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: newStatus },
    });

    await this.prisma.reportStatusHistory.create({
      data: { reportId, changedBy: managerId, status: newStatus, comment },
    });

    return { status: newStatus };
  }

  async getDashboardStats() {
    const totalSubmitted = await this.prisma.report.count({ where: { status: 'SUBMITTED' } });
    const needsCorrection = await this.prisma.report.count({ where: { status: 'NEEDS_CORRECTION' } });
    const approved = await this.prisma.report.count({ where: { status: 'APPROVED' } });
    const draft = await this.prisma.report.count({ where: { status: 'DRAFT' } });
    const openBlockers = await this.prisma.blocker.count({ where: { isKeyIssue: true } });

    const reportsByUser = await this.prisma.report.groupBy({
      by: ['userId'],
      _count: { id: true },
    });

    // --- Compliance rate: submitted+approved+needsCorrection vs draft(pending) vs late ---
    const totalReports = totalSubmitted + needsCorrection + approved + draft;
    const now = new Date();
    const lateDrafts = await this.prisma.report.count({
      where: { status: 'DRAFT', weekEnd: { lt: now } },
    });
    const compliance = {
      submitted: totalSubmitted + approved + needsCorrection,
      pending: draft - lateDrafts,
      late: lateDrafts,
      total: totalReports,
      rate: totalReports > 0
        ? Math.round(((totalSubmitted + approved + needsCorrection) / totalReports) * 100)
        : 0,
    };

    // --- Time spent by task type (team-wide) ---
    const hoursData = await this.prisma.hoursBreakdown.groupBy({
      by: ['taskType'],
      _sum: { hours: true },
    });
    const timeByTaskType = hoursData.map(h => ({
      taskType: h.taskType,
      hours: h._sum.hours || 0,
    }));

    // --- Workload / task distribution by project ---
    const projectReports = await this.prisma.report.groupBy({
      by: ['projectId'],
      _count: { id: true },
    });
    const projects = await this.prisma.project.findMany();
    const workloadByProject = projectReports.map(pr => {
      const project = projects.find(p => p.id === pr.projectId);
      return {
        project: project?.name || 'Unassigned',
        count: pr._count.id,
      };
    });

    // --- Recent activity feed ---
    const recentActivity = await this.prisma.reportStatusHistory.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        report: { include: { user: true, project: true } },
      },
    });
    const activityFeed = recentActivity.map(a => ({
      id: a.id,
      actorName: a.user?.name,
      reportOwner: a.report?.user?.name,
      project: a.report?.project?.name,
      status: a.status,
      comment: a.comment,
      createdAt: a.createdAt,
    }));

    return {
      totalSubmitted,
      needsCorrection,
      approved,
      openBlockers,
      reportsByUser,
      compliance,
      timeByTaskType,
      workloadByProject,
      activityFeed,
    };
  }

  async getTeamStatusForWeek(weekStart: string) {
    const start = new Date(weekStart);

    // Get all team members (not managers)
    const teamMembers = await this.prisma.user.findMany({
      include: { role: true },
    });
    const members = teamMembers.filter(u => u.role?.name === 'TEAM_MEMBER');

    // Get all reports for that exact week
    const reports = await this.prisma.report.findMany({
      where: { weekStart: start },
      include: { project: true },
    });

    // Map each member to their report status (or NOT_STARTED)
    const statusList = members.map(member => {
      const report = reports.find(r => r.userId === member.id);
      return {
        userId: member.id,
        name: member.name,
        email: member.email,
        status: report ? report.status : 'NOT_STARTED',
        project: report?.project?.name || null,
        reportId: report?.id || null,
      };
    });

    return statusList;
  }
  async getTeamSectionData(weekStart: string, section: string) {
  const start = new Date(weekStart);

  const reports = await this.prisma.report.findMany({
    where: {
      weekStart: start,
      status: { in: ['SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED'] },
    },
    include: {
      user: true,
      project: true,
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
        include: {
          blockers: true,
          achievements: true,
          plannedTasks: true,
        },
      },
    },
  });

  return reports.map(r => {
    const v = r.versions[0];
    return {
      userId: r.userId,
      name: r.user?.name,
      project: r.project?.name,
      blockers: v?.blockers || [],
      achievements: v?.achievements || [],
      nextWeekTasks: v?.plannedTasks || [],
    };
  });
}
}