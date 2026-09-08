import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService - Role-Based Access Control', () => {
  let service: ReportsService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      report: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should allow a team member to access their own report', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 'report-1',
      userId: 'user-1',
      user: {},
      project: {},
      versions: [],
      statusHistory: [],
    });

    const result = await service.getReportById('report-1', 'user-1', false);
    expect(result.id).toBe('report-1');
  });

  it('should deny a team member access to another team member\'s report', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 'report-1',
      userId: 'user-1', // report belongs to user-1
      user: {},
      project: {},
      versions: [],
      statusHistory: [],
    });

    // user-2 (a different team member) tries to access user-1's report
    await expect(
      service.getReportById('report-1', 'user-2', false),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow a manager to access any team member\'s report', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 'report-1',
      userId: 'user-1',
      user: {},
      project: {},
      versions: [],
      statusHistory: [],
    });

    // manager (isManager = true) can access even though managerId !== userId
    const result = await service.getReportById('report-1', 'manager-1', true);
    expect(result.id).toBe('report-1');
  });
});