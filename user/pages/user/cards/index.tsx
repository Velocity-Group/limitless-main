import { PureComponent } from 'react';
import {
  message, Layout, Spin, Button
} from 'antd';
import { DeleteOutlined, CreditCardOutlined } from '@ant-design/icons';
import Head from 'next/head';
import { IUIConfig } from 'src/interfaces';
import { paymentService } from '@services/index';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import Link from 'next/link';
import './index.less';
import PageHeading from '@components/common/page-heading';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  intl: IntlShape;
}

class CardsPage extends PureComponent<IProps> {
  static authenticate = true;

  state = {
    cards: [],
    loading: false,
    submiting: false
  };

  componentDidMount() {
    this.getData();
  }

  async handleRemoveCard(cardId: string) {
    const { intl } = this.props;
    if (
      !window.confirm(
        intl.formatMessage({
          id: 'areYouSureToRemoveThisPaymentCard',
          defaultMessage: 'Are you sure to remove this payment card?'
        })
      )
    ) { return; }
    try {
      this.setState({ submiting: true });
      await paymentService.removeStripeCard(cardId);
      this.getData();
    } catch (e) {
      const err = await e;
      message.error(
        err?.message
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
    } finally {
      this.setState({ submiting: false });
    }
  }

  async getData() {
    const { intl } = this.props;
    try {
      this.setState({ loading: true });
      const resp = await paymentService.getStripeCards();
      this.setState({
        cards: resp.data.data.map((d) => {
          if (d.card) return { ...d.card, id: d.id };
          if (d.three_d_secure) return { ...d.three_d_secure, id: d.id };
          return d;
        })
      });
    } catch (error) {
      message.error(
        getResponseError(error)
          || intl.formatMessage({
            id: 'errorOccurredPleaseTryAgainLater',
            defaultMessage: 'Error occurred, please try again later'
          })
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { cards, loading, submiting } = this.state;
    const { ui, intl } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'myPaymentCard',
              defaultMessage: 'My Payment Card'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            title={intl.formatMessage({
              id: 'myPaymentCard',
              defaultMessage: 'My Payment Card'
            })}
            icon={<CreditCardOutlined />}
          />
          <div className="card-list">
            {!loading && !cards.length && (
              <p>
                {intl.formatMessage({
                  id: 'noPaymentCardFound',
                  defaultMessage: 'No payment card found'
                })}
                ,
                {' '}
                <Link href="/user/cards/add-card">
                  <a>
                    {intl.formatMessage({
                      id: 'clickHereToAddAPaymentCard',
                      defaultMessage: 'click here to add a payment card'
                    })}
                  </a>
                </Link>
              </p>
            )}
            {!loading
              && cards.length > 0
              && cards.map((card) => (
                <div className="card-item" key={card.id}>
                  <Button
                    className="remove-btn"
                    type="link"
                    disabled={submiting}
                    onClick={() => this.handleRemoveCard(card.id)}
                  >
                    <DeleteOutlined />
                    {' '}
                    {intl.formatMessage({
                      id: 'remove',
                      defaultMessage: 'Remove'
                    })}
                  </Button>
                  <div className="card-info">
                    <span className="card-last-number">
                      {`**** **** **** ${card.last4}`}
                    </span>
                    <span className="card-brand">{card.brand}</span>
                  </div>
                  <div className="card-holder-name">
                    {card.name || 'Unknown'}
                  </div>
                </div>
              ))}
            {loading && (
              <div className="text-center">
                <Spin />
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({
  ui: { ...state.ui }
});
export default injectIntl(connect(mapState)(CardsPage));
