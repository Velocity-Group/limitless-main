import { PureComponent } from 'react';
import { Layout, Result, Button } from 'antd';
import { connect } from 'react-redux';
import Head from 'next/head';
import { IUser, IUIConfig } from 'src/interfaces';
import { HomeOutlined, PhoneOutlined } from '@ant-design/icons';
import Router from 'next/router';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  user: IUser;
  ui: IUIConfig;
  intl: IntlShape;
}

class PaymentCancel extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  render() {
    const { user, ui, intl } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'paymentFail',
              defaultMessage: 'Payment Fail'
            })}
          </title>
        </Head>
        <div className="main-container">
          <Result
            status="error"
            title={intl.formatMessage({
              id: 'paymentFail',
              defaultMessage: 'Payment Fail'
            })}
            subTitle={`${intl.formatMessage({
              id: 'hi',
              defaultMessage: 'Hi'
            })} ${user?.name
            || user?.username
            || intl.formatMessage({ id: 'there', defaultMessage: 'there' })
            }, ${intl.formatMessage({
              id: 'yourPaymentHasBeenFail',
              defaultMessage:
                  'your payment has been fail. Please contact us for more information.'
            })}`}
            extra={[
              <Button
                className="secondary"
                key="console"
                onClick={() => Router.push('/home')}
                style={{ textTransform: 'uppercase' }}
              >
                <HomeOutlined />
                {intl.formatMessage({
                  id: 'backHome',
                  defaultMessage: 'Back Home'
                })}
              </Button>,
              <Button
                key="buy"
                className="primary"
                onClick={() => Router.push('/contact')}
                style={{ textTransform: 'uppercase' }}
              >
                <PhoneOutlined />
                {intl.formatMessage({
                  id: 'contactUs',
                  defaultMessage: 'Contact Us'
                })}
              </Button>
            ]}
          />
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  user: state.user.current,
  ui: state.ui
});

export default injectIntl(connect(mapStates)(PaymentCancel));
