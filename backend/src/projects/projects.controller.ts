import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @Roles('MANAGER')
  create(@Body() body: { name: string; description?: string }) {
    return this.projectsService.create(body);
  }

  @Put(':id')
  @Roles('MANAGER')
  update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
    return this.projectsService.update(id, body);
  }

  @Delete(':id')
  @Roles('MANAGER')
  delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }

  @Post(':id/assign/:userId')
  @Roles('MANAGER')
  assignUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.assignUser(id, userId);
  }

  @Delete(':id/remove/:userId')
  @Roles('MANAGER')
  removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeUser(id, userId);
  }
}