import {
  Layout, message, Statistic
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { DollarOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import {
  IPerformer, IUIConfig, IEarning, IPerformerStats
} from 'src/interfaces';
import { earningService } from 'src/services';
import { getResponseError } from '@lib/utils';
import { TableListEarning } from '@components/performer/table-earning';
import { SearchFilter } from 'src/components/common/search-filter';
import PageHeading from '@components/common/page-heading';
import './index.less';

interface IProps {
  performer: IPerformer;
  ui: IUIConfig;
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
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName} | Earnings`}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading icon={<DollarOutlined />} title="Earnings" />
          <SearchFilter
            type={[
              { key: '', text: 'All types' },
              { key: 'product', text: 'Product' },
              { key: 'gallery', text: 'Gallery' },
              { key: 'feed', text: 'Post' },
              { key: 'video', text: 'Video' },
              { key: 'tip', text: 'Tip' },
              { key: 'stream_tip', text: 'Streaming tip' },
              { key: 'public_chat', text: 'Paid steaming' },
              { key: 'monthly_subscription', text: 'Monthly Subscription' },
              { key: 'yearly_subscription', text: 'Yearly Subscription' }
            ]}
            onSubmit={this.handleFilter.bind(this)}
            dateRange
          />
          <div className="stats-earning">
            <Statistic
              title="Total"
              prefix="$"
              value={stats?.totalGrossPrice || 0}
              precision={2}
            />
            <Statistic
              title="Platform commission"
              prefix="$"
              value={stats?.totalSiteCommission || 0}
              precision={2}
            />
            <Statistic
              title="Your Earnings"
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
export default connect(mapStates)(EarningPage);
