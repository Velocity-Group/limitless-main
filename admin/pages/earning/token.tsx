/* eslint-disable no-nested-ternary */
import Head from 'next/head';
import { PureComponent, Fragment } from 'react';
import {
  message, Statistic, Row, Col
} from 'antd';
import Page from '@components/common/layout/page';
import { earningService } from '@services/earning.service';
import { SearchFilter } from '@components/common/search-filter';
import { TableListEarning } from '@components/earning/table-list-earning';
import { BreadcrumbComponent } from '@components/common';
import { pick } from 'lodash';

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
    sortBy: 'createdAt',
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

  handleTableChange = (pagi, filters, sorter) => {
    const { pagination } = this.state;
    const pager = { ...pagination };
    pager.current = pagi.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'createdAt',
      sort: sorter.order ? (sorter.order === 'descend' ? 'desc' : 'asc') : 'desc'
    });
    this.search(pager.current);
  };

  async handleFilter(filter) {
    await this.setState({ filter });
    this.search();
    this.stats();
  }

  async search(page = 1) {
    const {
      filter, limit, sort, sortBy, pagination
    } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await earningService.search({
        ...filter,
        isToken: true,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      await this.setState({
        searching: false,
        list: resp.data.data,
        pagination: {
          ...pagination,
          total: resp.data.total,
          pageSize: limit
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      await this.setState({ searching: false });
    }
  }

  async stats() {
    const { filter } = this.state;
    try {
      const resp = await earningService.stats({
        ...filter,
        isToken: true
      });
      await this.setState({
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
        text: 'All Type'
      },
      {
        key: 'video',
        text: 'Video'
      },
      {
        key: 'product',
        text: 'Product'
      },
      {
        key: 'gallery',
        text: 'Gallery'
      },
      {
        key: 'feed',
        text: 'Post'
      },
      {
        key: 'tip',
        text: 'Tip'
      }
    ];

    return (
      <>
        <Head>
          <title>Token Earnings Report</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Token Earnings Report' }]} />
        <Page>
          <Row gutter={16} style={{ marginBottom: '10px' }}>
            <Col span={8}>
              <Statistic title="Total price" prefix={<img alt="coin" src="/coin-ico.png" width="20px" />} value={stats?.totalGrossPrice || 0} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Admin earned" prefix={<img alt="coin" src="/coin-ico.png" width="20px" />} value={stats?.totalSiteCommission || 0} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Model earned" prefix={<img alt="coin" src="/coin-ico.png" width="20px" />} value={stats?.totalNetPrice || 0} precision={2} />
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
