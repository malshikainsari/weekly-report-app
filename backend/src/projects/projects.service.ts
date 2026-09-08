import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      include: { userProjects: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { userProjects: { include: { user: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(data: { name: string; description?: string }) {
    return this.prisma.project.create({ data });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    return this.prisma.project.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  async assignUser(projectId: string, userId: string) {
    return this.prisma.userProject.upsert({
      where: { userId_projectId: { userId, projectId } },
      update: {},
      create: { userId, projectId },
    });
  }

  async removeUser(projectId: string, userId: string) {
    return this.prisma.userProject.delete({
      where: { userId_projectId: { userId, projectId } },
    });
  }
}