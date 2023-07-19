import Head from 'next/head';
import { useSelector } from 'react-redux';
import { Layout } from 'antd';
import {
  IPerformer,
  IUIConfig
} from 'src/interfaces';
import dynamic from 'next/dynamic';
import { IntlShape, useIntl } from 'react-intl';
import { authService } from 'src/services';

const IdVerificationForm = dynamic(() => import('@components/auth/veriff-verification'), { ssr: false });

interface IProps {
  verification: any;
}
function Verifications({ verification }: IProps) {
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
        <IdVerificationForm performer={user} verification={verification} />
      </div>
    </Layout>
  );
}

Verifications.authenticate = true;

Verifications.onlyPerformer = true;

Verifications.getInitialProps = async ({ ctx }) => {
  try {
    const { data: verification } = await authService.getDecision({
      Authorization: ctx.token
    });
    return { verification };
  } catch (e) {
    return { error: await e };
  }
};
export default Verifications;
