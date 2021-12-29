import { PureComponent } from 'react';
import {
  Table, message, Tag, Modal, Avatar
} from 'antd';
import Page from '@components/common/layout/page';
import {
  EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { formatDate } from '@lib/date';
import { BreadcrumbComponent, DropdownAction, SearchFilter } from '@components/common';
import { TableTokenChangeLogs } from '@components/user/change-token-change-log';
import { userService } from '@services/user.service'; import Head from 'next/head';
import Link from 'next/link';

interface IProps {
  status: string
}

export default class Performers extends PureComponent<IProps> {
  _selectedUser: any;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    openChangeTokenLogModal: false,
    list: [],
    limit: 10,
    filter: {} as any,
    sortBy: 'updatedAt',
    sort: 'desc'
  };

  componentDidMount() {
    const { status } = this.props;
    this.setState({ filter: { status: status || '' } }, () => this.search());
  }

  async handleTableChange(pagination, filters, sorter) {
    const pager = { ...pagination };
    pager.current = pagination.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      // eslint-disable-next-line no-nested-ternary
      sort: sorter.order ? (sorter.order === 'descend' ? 'desc' : 'asc') : 'desc'
    });
    this.search(pager.current);
  }

  async handleFilter(values) {
    const { filter } = this.state;
    await this.setState({ filter: { ...filter, ...values } });
    this.search();
  }

  async handleDelete(user) {
    const { pagination } = this.state;
    if (!window.confirm(`Are you sure to delete ${user?.name || user?.username || 'this user'}`)) return;
    try {
      await userService.delete(user._id);
      this.search(pagination.current);
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    }
  }

  async handleOpenChangeTokenLog(user) {
    this._selectedUser = user;
    this.setState({ openChangeTokenLogModal: true });
  }

  async search(page = 1) {
    const {
      limit, sort, filter, sortBy, pagination
    } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await userService.search({
        limit,
        offset: (page - 1) * limit,
        ...filter,
        sort,
        sortBy
      });
      this.setState({
        searching: false,
        list: resp.data.data,
        pagination: {
          ...pagination,
          total: resp.data.total
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  render() {
    const { status: defaultStatus } = this.props;
    const {
      list, searching, pagination, openChangeTokenLogModal
    } = this.state;
    const onDelete = this.handleDelete.bind(this);
    // const openChangeTokenLog = this.handleOpenChangeTokenLog.bind(this);
    const columns = [
      {
        title: 'Avatar',
        dataIndex: 'avatar',
        render: (avatar) => <Avatar src={avatar || '/no-avatar.png'} />
      },
      {
        title: 'Display Name',
        dataIndex: 'name'
      },
      {
        title: 'Username',
        dataIndex: 'username'
      },
      {
        title: 'Email',
        dataIndex: 'email'
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render(status) {
          switch (status) {
            case 'active':
              return <Tag color="green">Active</Tag>;
            case 'inactive':
              return <Tag color="red">Suspend</Tag>;
            case 'pending-email-confirmation':
              return <Tag color="default">Not verified email</Tag>;
            default: return <Tag color="default">{status}</Tag>;
          }
        }
      },
      {
        title: 'Verified Email?',
        dataIndex: 'verifiedEmail',
        render(verifiedEmail) {
          switch (verifiedEmail) {
            case true:
              return <Tag color="green">Y</Tag>;
            case false:
              return <Tag color="red">N</Tag>;
            default: return <Tag color="default">{verifiedEmail}</Tag>;
          }
        }
      },
      {
        title: 'Updated On',
        dataIndex: 'updatedAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: 'Action',
        dataIndex: '_id',
        render(id: string, record) {
          return (
            <DropdownAction
              menuOptions={[
                {
                  key: 'update',
                  name: 'Update',
                  children: (
                    <Link
                      href={{
                        pathname: '/users/update',
                        query: { id }
                      }}
                      as={`/users/update?id=${id}`}
                    >
                      <a>
                        <EditOutlined />
                        {' '}
                        Update
                      </a>
                    </Link>
                  )
                },
                {
                  key: 'delete',
                  name: 'Delete',
                  children: (
                    <a aria-hidden onClick={() => onDelete(record)}>
                      <DeleteOutlined />
                      {' '}
                      Delete
                    </a>
                  )
                }
                // {
                //   key: 'change-token-logs',
                //   name: 'Token balance change logs',
                //   children: (
                //     <a aria-hidden onClick={() => openChangeTokenLog(record)}>
                //       <HistoryOutlined />
                //       {' '}
                //       Token Change Logs
                //     </a>
                //   )
                // }
              ]}
            />
          );
        }
      }
    ];

    const statuses = [
      {
        key: '',
        text: 'All statuses'
      },
      {
        key: 'active',
        text: 'Active'
      },
      {
        key: 'inactive',
        text: 'Inactive'
      },
      {
        key: 'pending-email-confirmation',
        text: 'Not verified email'
      }
    ];

    return (
      <>
        <Head>
          <title>Users</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Users' }]} />
        <Page>
          <SearchFilter keyword onSubmit={this.handleFilter.bind(this)} statuses={statuses} defaultStatus={defaultStatus || ''} />
          <div style={{ marginBottom: '20px' }} />
          <div className="table-responsive">
            <Table
              dataSource={list}
              columns={columns}
              rowKey="_id"
              loading={searching}
              pagination={pagination}
              onChange={this.handleTableChange.bind(this)}
            />
          </div>
          <Modal
            title={`Token balance change logs of ${this._selectedUser?.name || this._selectedUser?.username || 'N/A'}`}
            destroyOnClose
            onCancel={() => this.setState({ openChangeTokenLogModal: false })}
            visible={openChangeTokenLogModal}
            footer={null}
          >
            <TableTokenChangeLogs sourceId={this._selectedUser?._id} source="user" />
          </Modal>
        </Page>
      </>
    );
  }
}
