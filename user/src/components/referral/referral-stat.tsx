import { IReferralStats } from '@interfaces/referral';
import { Statistic } from 'antd';
import './referral-stat.less';
import { IntlShape, useIntl } from 'react-intl';

interface IProps {
  stats: IReferralStats
}

function ReferralStat({ stats }: IProps) {
  const intl: IntlShape = useIntl();
  return (
    <div className="starts-referral">
      <Statistic
        title={intl.formatMessage({ id: 'totalNetPrice', defaultMessage: 'Total Net Price' })}
        prefix="$"
        value={stats?.totalNetPrice || 0}
        precision={2}
      />
      <Statistic
        title={intl.formatMessage({ id: 'totalReferrals', defaultMessage: 'Total Referrals' })}
        value={stats?.totalRegisters || 0}
      />
      <Statistic
        title={intl.formatMessage({ id: 'totalSales', defaultMessage: 'Total Sales' })}
        value={stats?.totalSales || 0}
      />
    </div>
  );
}

export default ReferralStat;
