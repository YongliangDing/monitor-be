import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import '../script';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule { }
