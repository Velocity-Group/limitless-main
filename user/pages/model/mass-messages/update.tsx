import PageHeading from '@components/common/page-heading';
import { IUIConfig } from '@interfaces/ui-config';
import { Layout, message } from 'antd';
import Head from 'next/dist/next-server/lib/head';
import { CommentOutlined } from '@ant-design/icons';
import { IntlShape, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { IMassMessage } from '@interfaces/message';
import { massMessageService } from '@services/mass-message.service';
import { MassMessageForm } from '@components/mass-message';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface IProps {
  massMessage: IMassMessage;
  error: any;
}

function UpdateMassMessagePage({ massMessage, error }: IProps) {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  if (error || !massMessage) {
    router.back();
  }
  const ui: IUIConfig = useSelector((state: any) => state.ui);
  const intl: IntlShape = useIntl();

  const update = async (data) => {
    try {
      setSubmitting(true);
      await massMessageService.update(massMessage._id, data);
      message.success(intl.formatMessage({ id: 'massMessageUpdateSuccessful', defaultMessage: 'Mass message update successful!' }));
      router.back();
    } catch (e) {
      const err = await e;
      message.error(err.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    } finally {
      setSubmitting(false);
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
          {intl.formatMessage({ id: 'updateMassMessages', defaultMessage: 'Update Mass Messages' })}
        </title>
      </Head>
      <div className="main-container">
        <PageHeading title={intl.formatMessage({ id: 'updateMassMessages', defaultMessage: 'Update Mass Messages' })} icon={<CommentOutlined />} />
        <MassMessageForm massMessage={massMessage} submitting={submitting} onFinish={update} />
      </div>
    </Layout>
  );
}

UpdateMassMessagePage.getInitialProps = async ({ ctx }) => {
  try {
    const { id } = ctx.query;
    const resp = await massMessageService.findOne(id);
    return {
      massMessage: resp.data,
      error: null
    };
  } catch (e) {
    const error = await e;
    return {
      error,
      massMessage: null
    };
  }
};

export default UpdateMassMessagePage;
