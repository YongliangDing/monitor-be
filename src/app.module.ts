import { Module } from '@nestjs/common';
import { LogsModule } from './logs/logs.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [LogsModule, EventsModule],
})
export class AppModule {}
