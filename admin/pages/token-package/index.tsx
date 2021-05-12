/* eslint-disable no-nested-ternary */
/* eslint-disable lines-between-class-members */
import Head from 'next/head';
import { PureComponent, Fragment } from 'react';
import { message } from 'antd';
import Page from '@components/common/layout/page';
import { tokenService } from '@services/token.service';
import { TableListToken } from '@components/token-package/list-token-package';
import { BreadcrumbComponent } from '@components/common';

interface IProps {
  performerId: string;
}

class Tokens extends PureComponent<IProps> {
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
    sort: 'desc'
  };

  async componentDidMount() {
    const { performerId } = this.props;
    const { filter } = this.state;
    if (performerId) {
      await this.setState({
        filter: {
          ...filter,
          ...{ performerId }
        }
      });
    }
    this.search();
  }

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...pagination };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'createdAt',
      sort: sorter.order
        ? sorter.order === 'descend'
          ? 'desc'
          : 'asc'
        : 'desc'
    });
    this.search(pager.current);
  };

  async handleFilter(filter) {
    await this.setState({ filter });
    this.search();
  }

  async search(page = 1) {
    try {
      await this.setState({ searching: true });
      const {
        filter, limit, sort, sortBy, pagination
      } = this.state;
      const resp = await tokenService.search({
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

  async deleteToken(id: string) {
    const { pagination } = this.state;
    if (!window.confirm('Are you sure you want to delete this token package?')) {
      return false;
    }
    try {
      await tokenService.delete(id);
      message.success('Deleted successfully');
      await this.search(pagination.current);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    }
    return undefined;
  }

  render() {
    const { list, searching, pagination } = this.state;
    // const { performerId } = this.props;
    // const statuses = [
    //   {
    //     key: '',
    //     text: 'All'
    //   },
    //   {
    //     key: 'active',
    //     text: 'Active'
    //   },
    //   {
    //     key: 'inactive',
    //     text: 'Inactive'
    //   }
    // ];

    return (
      <>
        <Head>
          <title>Token Packages</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Token Package' }]} />
        <Page>
          <div className="table-responsive">
            <TableListToken
              dataSource={list}
              rowKey="_id"
              loading={searching}
              pagination={pagination}
              onChange={this.handleTableChange.bind(this)}
              deleteToken={this.deleteToken.bind(this)}
            />
          </div>
        </Page>
      </>
    );
  }
}

export default Tokens;
