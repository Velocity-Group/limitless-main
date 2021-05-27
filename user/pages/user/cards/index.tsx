import { PureComponent } from 'react';
import {
  message, Layout, Spin
} from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import Head from 'next/head';
import Page from '@components/common/layout/page';
import {
  IUIConfig, IUser
} from 'src/interfaces';
import { paymentService } from '@services/index';
import { getResponseError } from '@lib/utils';
import { connect } from 'react-redux';
import Link from 'next/link';

interface IProps {
  currentUser: IUser;
  ui: IUIConfig
}

class CardsPage extends PureComponent<IProps> {
  static authenticate: boolean = true;

  state = {
    cards: [],
    loading: false
  };

  componentDidMount() {
    this.getData();
  }

  async getData() {
    try {
      await this.setState({ loading: true });
      const resp = await paymentService.getStripeCards();
      resp.data && this.setState({ cards: resp.data });
    } catch (error) {
      message.error(getResponseError(error) || 'An error occured. Please try again.');
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const {
      cards, loading
    } = this.state;
    const { ui } = this.props;
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
              <Link href="/model/my-post/create">
                <a>
                  {' '}
                  <PlusCircleOutlined />
                  {' '}
                  Add Card
                </a>
              </Link>
            </div>
            <div className="card-list">
              {!loading && !cards.length && (
              <p>
                No authorised card was found,
                {' '}
                <Link href="/user/cards/add-new"><a> click here to add</a></Link>
              </p>
              )}
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
  currentUser: { ...state.user.current }
});
const mapDispatch = { };
export default connect(mapState, mapDispatch)(CardsPage);
