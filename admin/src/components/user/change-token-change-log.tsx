import { PureComponent } from 'react';
import { message, Table } from 'antd';
import { formatDate } from '@lib/date';
import { userService } from '@services/user.service';

interface IProps {
  sourceId: string;
  source: string;
}

export class TableTokenChangeLogs extends PureComponent<IProps> {
  state = {
    offset: 0,
    items: [],
    pagination: {
      total: 0,
      pageSize: 10
    },
    searching: false
  }

  componentDidMount() {
    this.searchLogs();
  }

  async handleTableChange(pagination) {
    const { pagination: pager } = this.state;
    await this.setState({
      offset: (pagination.current - 1) * pager.pageSize
    });
    this.searchLogs();
  }

  async searchLogs() {
    const { sourceId, source } = this.props;
    const { offset, pagination } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await userService.changeTokenLogs({
        source,
        sourceId,
        offset,
        limit: pagination.pageSize
      });
      this.setState({ items: resp.data });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured');
    } finally {
      this.setState({ searching: false });
    }
  }

  render() {
    const columns = [
      {
        title: 'Amount of Tokens',
        dataIndex: 'token',
        render(token: number) {
          return (
            <span>
              <img alt="gem" src="/coin-ico.png" width="20px" />
              {token.toFixed(2)}
            </span>
          );
        }
      },
      {
        title: 'Date Change',
        dataIndex: 'createdAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      }
    ];
    const {
      searching, items, pagination
    } = this.state;
    return (
      <Table
        dataSource={items}
        columns={columns}
        rowKey="_id"
        loading={searching}
        pagination={pagination}
        onChange={this.handleTableChange.bind(this)}
      />
    );
  }
}
