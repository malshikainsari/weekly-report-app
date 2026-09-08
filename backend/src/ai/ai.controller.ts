import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('ai')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  @Roles('MANAGER')
  chat(@Body() body: { message: string }, @Request() req: any) {
    return this.aiService.chat(body.message, req.user.id);
  }

  @Post('summary')
  @Roles('MANAGER')
  generateSummary() {
    return this.aiService.generateTeamSummary();
  }
}