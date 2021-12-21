/* eslint-disable no-nested-ternary */
import Head from 'next/head';
import { PureComponent } from 'react';
import { message } from 'antd';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/common/search-filter';
import { TableListPaymentTransaction } from '@components/payment/table-list-payment';
import { BreadcrumbComponent } from '@components/common';
import { paymentService } from '@services/payment.service';

interface IProps {
  sourceId: string;
}

class PaymentTransaction extends PureComponent<IProps> {
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
    sort: 'desc'
  };

  async componentDidMount() {
    this.search();
  }

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...pagination };
    pager.current = pagination.current;
    this.setState({
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
  }

  async search(page = 1) {
    const {
      limit, filter, sort, sortBy, pagination
    } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await paymentService.search({
        ...filter,
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

  render() {
    const { list, searching, pagination } = this.state;
    const statuses = [
      {
        key: '',
        text: 'All'
      },
      {
        key: 'created',
        text: 'Created'
      },
      {
        key: 'processing',
        text: 'Processing'
      },
      {
        key: 'success',
        text: 'Success'
      },
      {
        key: 'fail',
        text: 'Fail'
      },
      {
        key: 'canceled',
        text: 'Cancelled'
      },
      {
        key: 'refunded',
        text: 'Refunded'
      }
    ];

    return (
      <>
        <Head>
          <title>Cash Payments</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Cash Payments' }]} />
        <Page>
          <SearchFilter dateRange statuses={statuses} onSubmit={this.handleFilter.bind(this)} />
          <div style={{ marginBottom: '20px' }} />
          <div className="table-responsive">
            <TableListPaymentTransaction
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

export default PaymentTransaction;
