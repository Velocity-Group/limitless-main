import Head from 'next/head';
import Link from 'next/link';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  Table, message, Dropdown, Button, Menu, Tag
} from 'antd';
import Page from '@components/common/layout/page';
import { IUser } from 'src/interfaces';
import { userService } from '@services/user.service';
import { SearchFilter } from '@components/user/search-filter';
import { DownOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatDate } from '@lib/date';
import { enquireScreen, unenquireScreen } from 'enquire-js';

interface IProps {
  currentUser: IUser;
}
class Users extends PureComponent<IProps> {
  enquireHandler: any;

  state = {
    pagination: {} as any,
    searching: false,
    list: [],
    limit: 10,
    filter: {} as any,
    sortBy: 'updatedAt',
    sort: 'desc',
    isMobile: false
  };

  componentDidMount() {
    this.enquireHandler = enquireScreen((mobile) => {
      const { isMobile } = this.state;
      if (isMobile !== mobile) {
        this.setState({
          isMobile: mobile
        });
      }
    });
    this.search();
  }

  componentWillUnmount() {
    unenquireScreen(this.enquireHandler);
  }

  async handleTableChange(pagination, filters, sorter) {
    const pager = { ...pagination };
    pager.current = pagination.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || '',
      // eslint-disable-next-line no-nested-ternary
      sort: sorter.order ? (sorter.order === 'descend' ? 'desc' : 'asc') : ''
    });
    this.search(pager.current);
  }

  async handleFilter(filter) {
    await this.setState({ filter });
    this.search();
  }

  async search(page = 1) {
    const {
      limit, filter,
      sort,
      sortBy, pagination
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
      await this.setState({
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

  render() {
    const {
      list, searching, pagination, isMobile
    } = this.state;
    const onDelete = this.handleDelete.bind(this);

    const columns = !isMobile ? [
      {
        title: 'First name',
        dataIndex: 'firstName'
      },
      {
        title: 'Last name',
        dataIndex: 'lastName'
      },
      {
        title: 'Display name',
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
              return <Tag color="red">Inactive</Tag>;
            case 'pending-email-confirmation':
              return <Tag color="default">Pending</Tag>;
            default: return <Tag color="default">{status}</Tag>;
          }
        }
      },
      {
        title: 'Verified Email',
        dataIndex: 'verifiedEmail',
        render(status) {
          switch (status) {
            case true:
              return <Tag color="green">Y</Tag>;
            case false:
              return <Tag color="red">N</Tag>;
            default: return <Tag color="default">{status}</Tag>;
          }
        }
      },
      // {
      //   title: 'Amount spent',
      //   dataIndex: '_id',
      //   render() {
      //     return <span>Not implement yet!</span>;
      //   }
      // },
      // {
      //   title: 'Watching time',
      //   dataIndex: '_id',
      //   render() {
      //     return <span>Not implement yet!</span>;
      //   }
      // },
      {
        title: 'CreatedAt',
        dataIndex: 'createdAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: '#',
        dataIndex: '_id',
        render(id: string, record) {
          return (
            <Dropdown
              overlay={(
                <Menu>
                  <Menu.Item key="edit">
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
                  </Menu.Item>
                  <Menu.Item key="delete">
                    <a aria-hidden onClick={() => onDelete(record)}>
                      <DeleteOutlined />
                      {' '}
                      Delete
                    </a>
                  </Menu.Item>
                </Menu>
              )}
            >
              <Button>
                Actions
                {' '}
                <DownOutlined />
              </Button>
            </Dropdown>
          );
        }
      }
    ] : [
      {
        title: 'Display name',
        fixed: 'left' as 'left',
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
              return <Tag color="red">Inactive</Tag>;
            case 'pending-email-confirmation':
              return <Tag color="default">Pending</Tag>;
            default: return <Tag color="default">{status}</Tag>;
          }
        }
      },
      {
        title: 'CreatedAt',
        dataIndex: 'createdAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: '#',
        dataIndex: '_id',
        render(id: string, record) {
          return (
            <Dropdown
              overlay={(
                <Menu>
                  <Menu.Item key="edit">
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
                  </Menu.Item>
                  <Menu.Item key="delete">
                    <a aria-hidden onClick={() => onDelete(record)}>
                      <DeleteOutlined />
                      {' '}
                      Delete
                    </a>
                  </Menu.Item>
                </Menu>
              )}
            >
              <Button>
                Actions
                {' '}
                <DownOutlined />
              </Button>
            </Dropdown>
          );
        }
      }
    ];
    return (
      <>
        <Head>
          <title>Users</title>
        </Head>
        <Page>
          <SearchFilter onSubmit={this.handleFilter.bind(this)} />
          <div style={{ marginBottom: '20px' }} />
          <div className="table-responsive">
            <Table
              dataSource={list}
              columns={columns}
              rowKey="_id"
              loading={searching}
              pagination={pagination}
              onChange={this.handleTableChange.bind(this)}
              scroll={isMobile ? { x: '150vw', y: '100vh' } : { x: '100vw', y: '90vh' }}
            />
          </div>
        </Page>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  currentUser: state.user.current
});
export default connect(mapStates)(Users);
