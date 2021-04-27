/* eslint-disable no-console */
/* eslint-disable import/first */
// global config for temmplates dir
require('dotenv').config();

process.env.TEMPLATE_DIR = `${__dirname}/templates`;

import { ConfigModule } from 'nestjs-config';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SettingModule } from './modules/settings/setting.module';
import { SettingMigration } from './scripts/setting-migration.script';
import { UserMigration } from './scripts/user-migration.script';
import { FooterMenuMigration } from './scripts/footer-menu-migration.script';
import { PostModule } from './modules/post/post.module';

@Module({
  imports: [
    ConfigModule.resolveRootPath(__dirname).load('config/**/!(*.d).{ts,js}'),
    AuthModule,
    UserModule,
    SettingModule,
    PostModule
  ],
  providers: [SettingMigration, UserMigration, FooterMenuMigration]
})
export class ScriptModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ScriptModule);

  console.log('Migrate setting');
  const settingMigration = app.get(SettingMigration);
  await settingMigration.up();

  console.log('Migrate user');
  const userMigration = app.get(UserMigration);
  await userMigration.up();

  console.log('Menu user');
  const footerMenuMigration = app.get(FooterMenuMigration);
  await footerMenuMigration.up();

  await app.close();
  process.exit();
}

export default ScriptModule;

bootstrap();
