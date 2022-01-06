import Head from 'next/head';
import Link from 'next/link';
import { PureComponent } from 'react';
import {
  Table, message, Tag, Modal, Avatar
} from 'antd';
import Page from '@components/common/layout/page';
import { performerService } from '@services/performer.service';
import { SearchFilter } from '@components/performer/search-filter';
import {
  EditOutlined, FireOutlined, DeleteOutlined, SkinOutlined,
  VideoCameraOutlined, PictureOutlined
} from '@ant-design/icons';
import { formatDate } from '@lib/date';
import { BreadcrumbComponent, DropdownAction } from '@components/common';
import { IPerformer } from 'src/interfaces';
import { TableTokenChangeLogs } from '@components/user/change-token-change-log';

interface IProps {
  status: string;
  verifiedDocument: string;
}

export default class Performers extends PureComponent<IProps> {
  _selectedUser: IPerformer;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [],
    limit: 10,
    filter: { } as any,
    sortBy: 'updatedAt',
    sort: 'desc',
    openChangeTokenLogModal: false
  };

  componentDidMount() {
    const { status, verifiedDocument } = this.props;
    this.setState({ filter: { status: status || '', verifiedDocument: verifiedDocument || '' } }, () => this.search());
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

  async handleDelete(performer) {
    const { pagination } = this.state;
    if (!window.confirm(`Are you sure to delete ${performer?.name || performer?.username || 'this model'}`)) return;
    try {
      await performerService.delete(performer._id);
      this.search(pagination.current);
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    }
  }

  async handleOpenChangeTokenLog(performer) {
    this._selectedUser = performer;
    this.setState({ openChangeTokenLogModal: true });
  }

  async search(page = 1) {
    const {
      limit, sort, filter, sortBy, pagination
    } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await performerService.search({
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
    const { status: defaultStatus, verifiedDocument: documentVerified } = this.props;
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
        dataIndex: 'name',
        render(name: string) {
          return <span>{name}</span>;
        }
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
            default: return <Tag color="red">N</Tag>;
          }
        }
      },
      {
        title: 'Verified ID?',
        dataIndex: 'verifiedDocument',
        render(verifiedDocument) {
          switch (verifiedDocument) {
            case true:
              return <Tag color="green">Y</Tag>;
            case false:
              return <Tag color="red">N</Tag>;
            default: return <Tag color="red">N</Tag>;
          }
        }
      },
      {
        title: 'Verified Account?',
        dataIndex: 'verifiedAccount',
        render(verifiedAccount) {
          switch (verifiedAccount) {
            case true:
              return <Tag color="green">Y</Tag>;
            case false:
              return <Tag color="red">N</Tag>;
            default: return <Tag color="red">N</Tag>;
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
                        pathname: '/model/update',
                        query: { id }
                      }}
                      as={`/model/update?id=${id}`}
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
                },
                {
                  key: 'posts',
                  name: 'Posts',
                  children: (
                    <Link
                      href={{
                        pathname: '/feed',
                        query: { performerId: id }
                      }}
                      as={`/feed?performerId=${id}`}
                    >
                      <a>
                        <FireOutlined />
                        {' '}
                        My Posts
                      </a>
                    </Link>
                  )
                },
                {
                  key: 'videos',
                  name: 'Videos',
                  children: (
                    <Link
                      href={{
                        pathname: '/video',
                        query: { performerId: id }
                      }}
                      as={`/video?performerId=${id}`}
                    >
                      <a>
                        <VideoCameraOutlined />
                        {' '}
                        My Videos
                      </a>
                    </Link>
                  )
                },
                {
                  key: 'galleries',
                  name: 'Galleries',
                  children: (
                    <Link
                      href={{
                        pathname: '/gallery',
                        query: { performerId: id }
                      }}
                      as={`/gallery?performerId=${id}`}
                    >
                      <a>
                        <PictureOutlined />
                        {' '}
                        My Galleries
                      </a>
                    </Link>
                  )
                },
                {
                  key: 'photos',
                  name: 'Photos',
                  children: (
                    <Link
                      href={{
                        pathname: '/photos',
                        query: { performerId: id }
                      }}
                      as={`/photos?performerId=${id}`}
                    >
                      <a>
                        <PictureOutlined />
                        {' '}
                        My Photos
                      </a>
                    </Link>
                  )
                },
                {
                  key: 'product',
                  name: 'Products',
                  children: (
                    <Link
                      href={{
                        pathname: '/product',
                        query: { performerId: id }
                      }}
                      as={`/product?performerId=${id}`}
                    >
                      <a>
                        <SkinOutlined />
                        {' '}
                        My Products
                      </a>
                    </Link>
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

    return (
      <>
        <Head>
          <title>Models</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Models' }]} />
        <Page>
          <SearchFilter
            onSubmit={this.handleFilter.bind(this)}
            defaultValue={{
              status: defaultStatus || '',
              verifiedDocument: documentVerified || ''
            }}
          />
          <div className="table-responsive custom">
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
            <TableTokenChangeLogs sourceId={this._selectedUser?._id} source="performer" />
          </Modal>
        </Page>
      </>
    );
  }
}
