import { PureComponent } from 'react';
import { Layout, Button, Result } from 'antd';
import { HomeIcon } from 'src/icons';
import { HistoryOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import Head from 'next/head';
import { clearCart } from '@redux/cart/actions';
import { updateCurrentUser } from '@redux/user/actions';
import { authService } from '@services/auth.service';
import { userService } from '@services/user.service';
import { IUser, IUIConfig } from 'src/interfaces';
import Router from 'next/router';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  user: IUser;
  clearCart: Function;
  updateCurrentUser: Function;
  ui: IUIConfig;
  intl: IntlShape;
}

class PaymentSuccess extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  componentDidMount() {
    const { clearCart: clearCartHandler } = this.props;
    this.updateCurrentUser();
    setTimeout(() => {
      clearCartHandler();
    }, 1000);
    localStorage.setItem('cart', JSON.stringify([]));
  }

  async updateCurrentUser() {
    const { updateCurrentUser: handleUpdateUser } = this.props;
    const token = authService.getToken();
    if (token) {
      const user = await userService.me({
        Authorization: token
      });
      if (!user.data._id) {
        return;
      }
      handleUpdateUser(user.data);
    }
  }

  render() {
    const { ui, user, intl } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'paymentSuccessful',
              defaultMessage: 'Payment Successful'
            })}
          </title>
        </Head>
        <div className="main-container">
          <Result
            status="success"
            title={intl.formatMessage({
              id: 'paymentSuccessful',
              defaultMessage: 'Payment Successful'
            })}
            subTitle={`${intl.formatMessage({
              id: 'hi',
              defaultMessage: 'Hi'
            })} ${user?.name
              || user?.username
              || intl.formatMessage({ id: 'there', defaultMessage: 'there' })
            }, ${intl.formatMessage({
              id: 'paymentHasBeenSuccessfullyProcessed',
              defaultMessage: 'your payment has been successfully processed'
            })}`}
            extra={[
              <Button
                className="secondary"
                key="console"
                onClick={() => Router.push('/home')}
                style={{ textTransform: 'uppercase' }}
              >
                <HomeIcon />
                {intl.formatMessage({
                  id: 'backHome',
                  defaultMessage: 'Back Home'
                })}
              </Button>,
              <Button
                key="buy"
                className="primary"
                onClick={() => Router.push('/user/payment-history')}
                style={{ textTransform: 'uppercase' }}
              >
                <HistoryOutlined />
                {intl.formatMessage({
                  id: 'paymentHistory',
                  defaultMessage: 'Payment History'
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

const mapDispatch = { clearCart, updateCurrentUser };
export default injectIntl(connect(mapStates, mapDispatch)(PaymentSuccess));
