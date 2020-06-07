import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { logsProviders } from './logs.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LogsController],
  providers: [LogsService, ...logsProviders],
})
export class LogsModule {}
