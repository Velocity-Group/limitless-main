/* eslint-disable no-nested-ternary */
import Head from 'next/head';
import { PureComponent } from 'react';
import {
  message, Statistic, Row, Col
} from 'antd';
import Page from '@components/common/layout/page';
import { earningService } from '@services/earning.service';
import { SearchFilter } from '@components/common/search-filter';
import { TableListEarning } from '@components/earning/table-list-earning';
import { BreadcrumbComponent } from '@components/common';

interface IEarningStatResponse {
  totalSiteCommission: number;
  totalGrossPrice: number;
  totalNetPrice: number;
}

interface IProps {
  sourceId: string;
  stats: IEarningStatResponse;
}

class Earning extends PureComponent<IProps> {
  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'updatedAt',
    sort: 'desc',
    stats: {
      totalGrossPrice: 0,
      totalSiteCommission: 0,
      totalNetPrice: 0
    } as IEarningStatResponse
  };

  async componentDidMount() {
    this.search();
    this.stats();
  }

  handleTableChange = async (pagi, filters, sorter) => {
    const { pagination } = this.state;
    const pager = { ...pagination };
    pager.current = pagi.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      sort: sorter.order ? (sorter.order === 'descend' ? 'desc' : 'asc') : 'desc'
    });
    this.search(pager.current);
  };

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.search();
    this.stats();
  }

  async search(page = 1) {
    const {
      filter, limit, sort, sortBy, pagination
    } = this.state;
    try {
      this.setState({ searching: true });
      const resp = await earningService.search({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      this.setState({
        searching: false,
        list: resp.data.data.map((item) => {
          const obj = item;
          obj.siteEarning = (item.grossPrice - item.netPrice);
          return obj;
        }),
        pagination: {
          ...pagination,
          total: resp.data.total,
          pageSize: limit
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  async stats() {
    const { filter } = this.state;
    try {
      const resp = await earningService.stats({
        ...filter
      });
      this.setState({
        stats: resp.data
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
    }
  }

  render() {
    const {
      list, searching, pagination, stats
    } = this.state;
    const type = [
      {
        key: '',
        text: 'All Types'
      },
      { key: 'tip', text: 'Tip' },
      { key: 'feed', text: 'Post' },
      { key: 'video', text: 'Video' },
      { key: 'gallery', text: 'Gallery' },
      { key: 'product', text: 'Product' },
      { key: 'stream_tip', text: 'Streaming tip' },
      { key: 'public_chat', text: 'Paid steaming' },
      {
        key: 'monthly_subscription',
        text: 'Monthly Subscription'
      },
      {
        key: 'yearly_subscription',
        text: 'Yearly Subscription'
      }
    ];

    return (
      <>
        <Head>
          <title>Earnings Report</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Earnings Report' }]} />
        <Page>
          <Row gutter={16} style={{ marginBottom: '10px' }}>
            <Col span={8}>
              <Statistic title="Total Earnings" prefix="$" value={stats?.totalGrossPrice || 0} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Platform Earnings" prefix="$" value={stats?.totalSiteCommission || 0} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Models Earnings" prefix="$" value={stats?.totalNetPrice || 0} precision={2} />
            </Col>
          </Row>
          <SearchFilter
            type={type}
            onSubmit={this.handleFilter.bind(this)}
            searchWithPerformer
            dateRange
          />
          <div style={{ marginBottom: '20px' }} />
          <div className="table-responsive">
            <TableListEarning
              dataSource={list}
              rowKey="_id"
              loading={searching}
              pagination={pagination}
              onChange={this.handleTableChange.bind(this)}
            />
          </div>
        </Page>
      </>
    );
  }
}

export default Earning;
