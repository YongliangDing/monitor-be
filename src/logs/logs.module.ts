import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { WatchService } from './log.watch.service';
import { logsProviders } from './logs.providers';
import { DatabaseModule } from '../database/database.module'; 
import { EventsModule } from '../events/events.module';

@Module({
  imports: [DatabaseModule, EventsModule],
  controllers: [LogsController],
  providers: [LogsService, ...logsProviders, WatchService],
})
export class LogsModule {}
