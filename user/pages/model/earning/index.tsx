import {
  Layout, message, Statistic
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { DollarOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import {
  IPerformer,
  IUIConfig,
  IEarning,
  IPerformerStats
} from 'src/interfaces';
import { earningService } from 'src/services';
import { getResponseError } from '@lib/utils';
import TableListEarning from '@components/performer/table-earning';
import PageHeading from '@components/common/page-heading';
import './index.less';
import { injectIntl, IntlShape } from 'react-intl';
import SearchFilter from '@components/common/search-filter';

interface IProps {
  performer: IPerformer;
  ui: IUIConfig;
  intl: IntlShape;
}
interface IStates {
  loading: boolean;
  earning: IEarning[];
  pagination: {
    total: number;
    current: number;
    pageSize: number;
  };
  stats: IPerformerStats;
  sortBy: string;
  sort: string;
  type: string;
  dateRange: any;
}

const initialState = {
  loading: true,
  earning: [],
  pagination: { total: 0, current: 1, pageSize: 10 },
  stats: {
    totalGrossPrice: 0,
    totalSiteCommission: 0,
    totalNetPrice: 0,
    totalReferralCommission: 0,
    totalAgentCommission: 0
  },
  sortBy: 'createdAt',
  sort: 'desc',
  type: '',
  dateRange: null
};

class EarningPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  constructor(props: IProps) {
    super(props);
    this.state = initialState;
  }

  componentDidMount() {
    this.getData();
    this.getPerformerStats();
  }

  async handleFilter(data) {
    const { dateRange } = this.state;
    await this.setState({
      type: data.type,
      dateRange: {
        ...dateRange,
        fromDate: data.fromDate,
        toDate: data.toDate
      }
    });
    this.getData();
    this.getPerformerStats();
  }

  async handleTabsChange(data) {
    const { pagination } = this.state;
    await this.setState({
      pagination: { ...pagination, current: data.current }
    });
    this.getData();
  }

  async getData() {
    const {
      pagination, sort, sortBy, type, dateRange
    } = this.state;
    try {
      const { current, pageSize } = pagination;
      const earning = await earningService.performerSearch({
        limit: pageSize,
        offset: (current - 1) * pageSize,
        sort,
        sortBy,
        type,
        ...dateRange
      });
      this.setState({
        earning: earning.data.data,
        pagination: { ...pagination, total: earning.data.total },
        loading: false
      });
    } catch (error) {
      message.error(getResponseError(await error));
      this.setState({ loading: false });
    }
  }

  async getPerformerStats() {
    const { dateRange, type } = this.state;
    const resp = await earningService.performerStarts({
      type,
      ...dateRange
    });
    resp.data && this.setState({ stats: resp.data });
  }

  render() {
    const {
      loading, earning, pagination, stats
    } = this.state;
    const { ui, intl } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName} | Earnings`}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading icon={<DollarOutlined />} title={intl.formatMessage({ id: 'earnings', defaultMessage: 'Earnings' })} />
          <SearchFilter
            type={[
              { key: '', text: intl.formatMessage({ id: 'allTypes', defaultMessage: 'All types' }) },
              { key: 'product', text: intl.formatMessage({ id: 'product', defaultMessage: 'Product' }) },
              { key: 'gallery', text: intl.formatMessage({ id: 'gallery', defaultMessage: 'Gallery' }) },
              { key: 'feed', text: intl.formatMessage({ id: 'post', defaultMessage: 'Post' }) },
              { key: 'video', text: intl.formatMessage({ id: 'video', defaultMessage: 'Video' }) },
              { key: 'tip', text: intl.formatMessage({ id: 'tip', defaultMessage: 'Tip' }) },
              { key: 'stream_tip', text: intl.formatMessage({ id: 'streamingTip', defaultMessage: 'Streaming tip' }) },
              { key: 'public_chat', text: intl.formatMessage({ id: 'paidSteaming', defaultMessage: 'Paid steaming' }) },
              { key: 'monthly_subscription', text: intl.formatMessage({ id: 'monthlySubscription', defaultMessage: 'Monthly Subscription' }) },
              { key: 'yearly_subscription', text: intl.formatMessage({ id: 'yearlySubscription', defaultMessage: 'Yearly Subscription' }) }
            ]}
            onSubmit={this.handleFilter.bind(this)}
            dateRange
          />
          <div className="stats-earning">
            <Statistic
              title={intl.formatMessage({ id: 'total', defaultMessage: 'Total' })}
              prefix="$"
              value={stats?.totalGrossPrice || 0}
              precision={2}
            />
            <Statistic
              title={intl.formatMessage({ id: 'platformCommission', defaultMessage: 'Platform commission' })}
              prefix="$"
              value={stats?.totalSiteCommission || 0}
              precision={2}
            />
            <Statistic
              title={intl.formatMessage({ id: 'yourEarnings', defaultMessage: 'Your Earnings' })}
              prefix="$"
              value={stats?.totalNetPrice || 0}
              precision={2}
            />
          </div>
          <div className="table-responsive">
            <TableListEarning
              dataSource={earning}
              rowKey="_id"
              pagination={pagination}
              loading={loading}
              onChange={this.handleTabsChange.bind(this)}
            />
          </div>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state) => ({
  ui: { ...state.ui },
  performer: { ...state.user.current }
});
export default injectIntl(connect(mapStates)(EarningPage));
