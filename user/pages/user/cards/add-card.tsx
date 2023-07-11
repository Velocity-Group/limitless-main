import { PureComponent } from 'react';
import { message, Layout } from 'antd';
import PageHeading from '@components/common/page-heading';
import { CreditCardOutlined } from '@ant-design/icons';
import Head from 'next/head';
import {
  IUIConfig
} from 'src/interfaces';
import { paymentService } from '@services/index';
import { connect } from 'react-redux';
import { getCurrentUser } from '@redux/auth/actions';
import StripeCardForm from '@components/user/stripe-card-form';
import Router from 'next/router';
import './index.less';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  getCurrentUser: Function;
  intl: IntlShape;
}

class NewCardPage extends PureComponent<IProps> {
  static authenticate = true;

  state = {
    submiting: false
  };

  async handleAddCard(source: any) {
    const { getCurrentUser: handleUpdateCurrentUser, intl } = this.props;
    try {
      this.setState({ submiting: true });
      await paymentService.addStripeCard({ sourceToken: source.id });
      handleUpdateCurrentUser();
      message.success(
        intl.formatMessage({
          id: 'paymentCardAddedSuccessfully',
          defaultMessage: 'Payment card added successfully'
        })
      );
      Router.replace('/user/cards');
    } catch (error) {
      const e = await error;
      message.error(
        e?.message
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
      this.setState({ submiting: false });
    }
  }

  render() {
    const { ui, intl } = this.props;
    const { submiting } = this.state;

    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'addNewCard',
              defaultMessage: 'Add New Card'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'addNewCard',
              defaultMessage: 'Add New Card'
            })}
            icon={<CreditCardOutlined />}
          />
          <div className="card-form">
            <StripeCardForm submit={this.handleAddCard.bind(this)} submiting={submiting} />
          </div>
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({
  ui: { ...state.ui }
});
const mapDispatch = { getCurrentUser };
export default injectIntl(connect(mapState, mapDispatch)(NewCardPage));
