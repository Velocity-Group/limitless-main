import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import {
  AdminChangeTokenBalanceLogSchema
} from '../schemas/admin-change-token-balance-log.schema';

export const ADMIN_CHANGE_TOKEN_BALANCE_LOGS = 'ADMIN_CHANGE_TOKEN_BALANCE_LOGS';

export const changeTokenLogsProviders = [
  {
    provide: ADMIN_CHANGE_TOKEN_BALANCE_LOGS,
    useFactory: (connection: Connection) => connection.model('AdminChangeTokenBalanceLogs', AdminChangeTokenBalanceLogSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
