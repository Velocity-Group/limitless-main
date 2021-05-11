import {
  Layout, message, Row, Col, Statistic
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import Loader from '@components/common/base/loader';
import { connect } from 'react-redux';
import {
  IPerformer,
  IUIConfig,
  IEarning,
  IPerformerStats
} from 'src/interfaces';
import { earningService } from 'src/services';
import { getResponseError } from '@lib/utils';
import { TableListEarning } from '@components/performer/table-earning';
import { SearchFilter } from 'src/components/common/search-filter';

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

class EarningPage extends PureComponent<IProps, IStates> {
  static onlyPerformer = true;

  static authenticate = true;

  constructor(props: IProps) {
    super(props);
    this.state = {
      loading: true,
      earning: [],
      pagination: { total: 0, current: 1, pageSize: 10 },
      stats: {
        totalGrossPrice: 0,
        totalSiteCommission: 0,
        totalNetPrice: 0
      },
      sortBy: 'createdAt',
      sort: 'desc',
      type: '',
      dateRange: null
    };
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
      await this.setState({
        earning: earning.data.data,
        pagination: { ...pagination, total: earning.data.total }
      });
    } catch (error) {
      message.error(getResponseError(error));
    } finally {
      this.setState({ loading: false });
    }
  }

  async getPerformerStats() {
    const { dateRange, type } = this.state;
    const resp = await earningService.performerStarts({
      type,
      ...dateRange
    });
    await this.setState({ stats: resp.data });
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
            {' '}
            {ui && ui.siteName}
            {' '}
            | Earning Report
          </title>
        </Head>
        <div className="main-container">
          <div className="page-heading">Earning Report</div>
          <SearchFilter
            type={[
              { key: '', text: 'All' },
              { key: 'monthly_subscription', text: 'Monthly Subscription' },
              { key: 'yearly_subscription', text: 'Yearly Subscription' },
              { key: 'private_chat', text: 'Private Chat' },
              { key: 'public_chat', text: 'Public Chat' },
              { key: 'group_chat', text: 'Group Chat' },
              { key: 'feed', text: 'Feed Post' },
              { key: 'product', text: 'Product' },
              { key: 'video', text: 'Video' },
              { key: 'tip', text: 'Tip' }
            ]}
            onSubmit={this.handleFilter.bind(this)}
            dateRange
          />
          {loading ? (
            <Loader />
          ) : (
            <div>
              {earning && earning.length > 0 ? (
                <div>
                  <Row gutter={16} style={{ marginBottom: '10px' }}>
                    <Col span={8}>
                      <Statistic
                        title="Total Earned"
                        prefix={<img alt="coin" src="/static/coin-ico.png" width="20px" />}
                        value={stats.totalGrossPrice || 0}
                        precision={2}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Site Commission"
                        prefix={<img alt="coin" src="/static/coin-ico.png" width="20px" />}
                        value={stats.totalSiteCommission || 0}
                        precision={2}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="You Earned"
                        prefix={<img alt="coin" src="/static/coin-ico.png" width="20px" />}
                        value={stats.totalNetPrice || 0}
                        precision={2}
                      />
                    </Col>
                  </Row>
                  <div className="table-responsive">
                    <TableListEarning
                      dataSource={earning}
                      rowKey="_id"
                      pagination={pagination}
                      onChange={this.handleTabsChange.bind(this)}
                    />
                  </div>
                </div>
              ) : (
                <span>No data found.</span>
              )}
            </div>
          )}
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
