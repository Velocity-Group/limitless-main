import PageHeading from '@components/common/page-heading';
import { IUIConfig } from '@interfaces/ui-config';
import {
  Form,
  Layout,
  Tabs,
  message
} from 'antd';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import { CommentOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { IntlShape, useIntl } from 'react-intl';
import { MassMessageForm, MassMessageTable } from '@components/mass-message';
import { massMessageService } from '@services/index';

function MassMessagePage() {
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [massMessages, setMassMessages] = useState(null);
  const [pagination, setPagination] = useState({} as any);
  const [filter] = useState({} as any);
  const limit = 10;
  const ui: IUIConfig = useSelector((state: any) => state.ui);
  const intl: IntlShape = useIntl();
  const [form] = Form.useForm();

  const search = async (page = 1, event = { sort: 'desc', sortBy: 'updatedAt' }) => {
    try {
      setSearching(true);
      const resp = await massMessageService.searchMassMessages({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort: event.sort,
        sortBy: event.sortBy
      });
      setMassMessages(resp.data.data);
      setPagination({
        ...pagination,
        total: resp.data.total,
        pageSize: limit
      });
    } catch (e) {
      const err = await e;
      message.error(
        err.message
        || intl.formatMessage({
          id: 'somethingWentWrong',
          defaultMessage: 'Something went wrong, please try again!'
        })
      );
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    search();
  }, []);

  const handleTableChange = async (pag, filters, sorter) => {
    const pager = { ...pagination };
    pager.current = pag.current;
    setPagination(pager);
    // eslint-disable-next-line no-nested-ternary
    search(pager.current, { sort: sorter.order ? (sorter.order === 'descend' ? 'desc' : 'asc') : 'desc', sortBy: sorter.field || 'updatedAt' });
  };

  const handleTabChange = async (key: 'messageForm' | 'messageTable') => {
    if (key === 'messageTable') {
      search();
    }
  };

  const send = async (data) => {
    try {
      setSubmitting(true);
      await massMessageService.sendMassMessages(data);
      message.success(intl.formatMessage({ id: 'sendMassMessageSuccessfully', defaultMessage: 'Send mass message successfully!' }));
      form.resetFields();
    } catch (e) {
      const err = await e;
      message.error(err.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm(intl.formatMessage({ id: 'areYouSureYouWantToDeleteThisMessage', defaultMessage: 'Are you sure you want to delete this message?' }))) {
      return;
    }
    try {
      await massMessageService.delete(id);
      message.success(intl.formatMessage({ id: 'deletedSuccessfully', defaultMessage: 'Deleted successfully' }));
      await search(pagination.current);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    }
  };

  return (
    <Layout>
      <Head>
        <title>
          {' '}
          {ui && ui.siteName}
          {' '}
          |
          {' '}
          {intl.formatMessage({ id: 'sendMassMessages', defaultMessage: 'Send Mass Messages' })}
        </title>
      </Head>
      <div className="main-container">
        <PageHeading title={intl.formatMessage({ id: 'sendMassMessages', defaultMessage: 'Send Mass Messages' })} icon={<CommentOutlined />} />
        <Tabs defaultActiveKey="messageForm" onChange={handleTabChange}>
          <Tabs.TabPane tab={intl.formatMessage({ id: 'massMessageForm', defaultMessage: 'Mass Message Form' })} key="messageForm">
            <MassMessageForm submitting={submitting} onFinish={send} form={form} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Mass Message Table" key="messageTable">
            <MassMessageTable
              dataSource={massMessages}
              rowKey="_id"
              pagination={pagination}
              loading={searching}
              onChange={handleTableChange}
              deleteMessage={deleteMessage}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Layout>
  );
}

export default MassMessagePage;
