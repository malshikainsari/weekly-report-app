import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  createReport(@Request() req: any, @Body() body: any) {
    return this.reportsService.createReport(req.user.id, body);
  }

  @Get('my')
  getMyReports(@Request() req: any) {
    return this.reportsService.getMyReports(req.user.id);
  }

  @Get('all')
  @Roles('MANAGER')
  getAllReports(@Query() query: any) {
    return this.reportsService.getAllReports(query);
  }

  @Get('dashboard')
  @Roles('MANAGER')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('team-status')
  async getTeamStatus(@Query('weekStart') weekStart: string) {
    return this.reportsService.getTeamStatusForWeek(weekStart);
  }

  @Get('team-section')
@Roles('MANAGER')
getTeamSection(
  @Query('weekStart') weekStart: string,
  @Query('section') section: string,
) {
  return this.reportsService.getTeamSectionData(weekStart, section);
}

  @Get(':id')
  getReportById(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.getReportById(id, req.user.id, req.user.role === 'MANAGER');
  }

  @Post(':id/submit')
  submitReport(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.reportsService.submitReport(id, req.user.id, body);
  }

  @Post(':id/review')
  @Roles('MANAGER')
  reviewReport(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.reportsService.reviewReport(id, req.user.id, body.action, body.comment);
  }
}