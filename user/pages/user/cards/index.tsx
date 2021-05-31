import { PureComponent } from 'react';
import {
  message, Layout, Spin, Button
} from 'antd';
import { PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import Head from 'next/head';
import Page from '@components/common/layout/page';
import {
  IUIConfig, IUser
} from 'src/interfaces';
import { paymentService } from '@services/index';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import Link from 'next/link';
import './index.less';

interface IProps {
  ui: IUIConfig;
  user: IUser
}

class CardsPage extends PureComponent<IProps> {
  static authenticate: boolean = true;

  state = {
    cards: [],
    loading: false,
    submiting: false
  };

  componentDidMount() {
    this.getData();
  }

  async handleRemoveCard(cardId: string) {
    if (!window.confirm('Are you sure to remove this card')) return;
    try {
      await this.setState({ submiting: true });
      await paymentService.removeStripeCard(cardId);
      this.getData();
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  async getData() {
    try {
      await this.setState({ loading: true });
      const resp = await paymentService.getStripeCards();
      this.setState({ cards: resp.data.data });
    } catch (error) {
      message.error(getResponseError(error) || 'An error occured. Please try again.');
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const {
      cards, loading, submiting
    } = this.state;
    const { ui, user } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | My Cards
          </title>
        </Head>
        <div className="main-container">
          <Page>
            <div className="page-heading" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>My Cards</span>
              {(!user.stripeCardIds || !user.stripeCardIds.length) && (
              <Link href="/user/cards/add-card">
                <a>
                  {' '}
                  <PlusCircleOutlined />
                  {' '}
                  Add Card
                </a>
              </Link>
              )}
            </div>
            <div className="card-list">
              {!loading && !cards.length && (
              <p>
                No authorised card was found, please add a payment card.
              </p>
              )}
              {!loading && cards.length > 0 && cards.map((card) => (
                <div className="card-item" key={card.id}>
                  <Button className="remove-btn" type="link" disabled={submiting} onClick={() => this.handleRemoveCard(card.id)}>
                    <DeleteOutlined />
                    {' '}
                    Remove
                  </Button>
                  <div className="card-info">
                    <span className="card-last-number">
                      {`**** **** **** ${card.last4}`}
                    </span>
                    <span className="card-brand">{card.brand}</span>
                  </div>
                  <div className="card-holder-name">
                    {card.name || 'Unknow'}
                  </div>
                </div>
              ))}
              {loading && <div className="text-center"><Spin /></div>}
            </div>
          </Page>
        </div>
      </Layout>
    );
  }
}

const mapState = (state: any) => ({
  ui: { ...state.ui },
  user: { ...state.user.current }
});
const mapDispatch = { };
export default connect(mapState, mapDispatch)(CardsPage);
