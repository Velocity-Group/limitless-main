import Head from 'next/head';
import { useSelector } from 'react-redux';
import { Layout } from 'antd';
import {
  IPerformer,
  IUIConfig
} from 'src/interfaces';
import dynamic from 'next/dynamic';
import { IntlShape, useIntl } from 'react-intl';

const IdVerificationForm = dynamic(() => import('@components/auth/veriff-verification'), { ssr: false });

function Verifications() {
  const user: IPerformer = useSelector((state: any) => state.user.current);
  const ui: IUIConfig = useSelector((state: any) => state.ui);
  const intl: IntlShape = useIntl();
  return (
    <Layout>
      <Head>
        <title>
          {ui && ui.siteName}
          {' '}
          |
          {' '}
          {intl.formatMessage({ id: 'idVerification', defaultMessage: 'ID Verification' })}
        </title>
      </Head>
      <div className="main-container">
        <IdVerificationForm performer={user} />
      </div>
    </Layout>
  );
}

Verifications.authenticate = true;

Verifications.onlyPerformer = true;

export default Verifications;
