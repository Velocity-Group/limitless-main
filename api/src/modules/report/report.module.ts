import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { ReportController } from './controllers/report.controller';
import { ReportService } from './services/report.service';
import { reportProviders } from './providers';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';

@Module({
  imports: [
    QueueModule.forRoot(),
    MongoDBModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule)
  ],
  providers: [...reportProviders, ReportService],
  controllers: [ReportController],
  exports: [ReportService]
})
export class ReportModule {}
