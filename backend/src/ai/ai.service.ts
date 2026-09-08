import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';

@Injectable()
export class AiService {
  private groq: Groq;

  constructor(private prisma: PrismaService) {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async chat(message: string, managerId: string) {
    // Fetch team data for context
    const reports = await this.prisma.report.findMany({
      include: {
        user: true,
        project: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            tasks: true,
            blockers: true,
            achievements: true,
            hoursBreakdown: true,
          },
        },
      },
      orderBy: { weekStart: 'desc' },
      take: 20,
    });

    const teamContext = reports.map(r => {
      const v = r.versions[0];
      return `
Team Member: ${r.user?.name}
Week: ${new Date(r.weekStart).toLocaleDateString()} - ${new Date(r.weekEnd).toLocaleDateString()}
Project: ${r.project?.name || 'N/A'}
Status: ${r.status}
Tasks: ${v?.tasks?.map(t => `${t.name} (${t.status}, ${t.actualPct}% done)`).join(', ') || 'None'}
Blockers: ${v?.blockers?.map(b => b.description).join(', ') || 'None'}
Achievements: ${v?.achievements?.map(a => a.description).join(', ') || 'None'}
Hours: ${v?.hoursBreakdown?.map(h => `${h.taskType}: ${h.hours}h`).join(', ') || 'None'}
      `.trim();
    }).join('\n\n---\n\n');

    const systemPrompt = `You are an AI assistant for a team management tool called WeeklyReport. 
You have access to the team's weekly report data and can answer questions about team activity, progress, blockers, and workload.
Be concise, helpful, and professional. Use the data provided to give accurate, specific answers.

Current Team Data:
${teamContext}`;

    const response = await this.groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    return {
      message: response.choices[0]?.message?.content || 'Sorry, I could not generate a response.',
    };
  }

  async generateTeamSummary() {
    const reports = await this.prisma.report.findMany({
      where: {
        weekStart: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      include: {
        user: true,
        project: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: { tasks: true, blockers: true, achievements: true },
        },
      },
    });

    const teamContext = reports.map(r => {
      const v = r.versions[0];
      return `${r.user?.name} (${r.project?.name}): Status=${r.status}, Tasks=${v?.tasks?.length || 0}, Blockers=${v?.blockers?.length || 0}`;
    }).join('\n');

    const response = await this.groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: 'You are a team management AI. Generate a concise weekly team summary highlighting completed work, recurring blockers, and workload imbalances. Be specific and actionable.',
        },
        {
          role: 'user',
          content: `Generate a team summary based on this data:\n${teamContext}`,
        },
      ],
      max_tokens: 512,
    });

    return {
      summary: response.choices[0]?.message?.content || 'Unable to generate summary.',
    };
  }
}