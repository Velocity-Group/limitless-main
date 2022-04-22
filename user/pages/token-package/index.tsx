import Head from 'next/head';
import {
  Layout, message, Row, Col, Card, Button, Modal, Input, Spin
} from 'antd';
import PageHeading from '@components/common/page-heading';
import { WalletOutlined } from '@ant-design/icons';
import { PureComponent } from 'react';
import { tokenPackageService } from '@services/token-package.service';
import { paymentService } from '@services/index';
import {
  IUIConfig, IPackageToken, IUser, ISettings
} from '@interfaces/index';
import { connect } from 'react-redux';
import Router from 'next/router';
import Loader from '@components/common/base/loader';
import './index.less';

interface IProps {
  ui: IUIConfig;
  user: IUser;
  settings: ISettings
}

class TokenPackages extends PureComponent<IProps> {
  static authenticate = true;

  state = {
    searching: false,
    submiting: false,
    list: [] as any,
    couponCode: '',
    openPurchaseModal: false,
    selectedPackage: null,
    paymentGateway: 'ccbill',
    paymentUrl: '',
    coupon: null
  };

  async componentDidMount() {
    this.search();
  }

  onChangepaymentGateway(paymentGateway: string) {
    this.setState({ paymentGateway });
  }

  async search() {
    try {
      await this.setState({ searching: true });
      const resp = await tokenPackageService.search({
        limit: 200
      });
      this.setState({
        searching: false,
        list: resp.data.data
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  async purchaseTokenPackage() {
    const { user } = this.props;
    const {
      paymentGateway = 'stripe', couponCode, selectedPackage
    } = this.state;
    if (paymentGateway === 'stripe' && !user?.stripeCardIds?.length) {
      message.error('Please add a payment card to complete your purchase');
      Router.push('/user/cards');
      return;
    }
    try {
      this.setState({ submiting: true });
      const resp = await paymentService.purchaseTokenPackage(selectedPackage._id, {
        paymentGateway,
        stripeCardId: user.stripeCardIds && user.stripeCardIds[0],
        couponCode
      });
      if (paymentGateway === 'ccbill') {
        this.setState({ paymentUrl: resp?.data?.paymentUrl, submiting: false });
      } else {
        this.setState({ openPurchaseModal: false });
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ openPurchaseModal: false, submiting: false });
    }
  }

  async applyCoupon() {
    const { couponCode } = this.state;
    if (!couponCode) return;
    try {
      const resp = await paymentService.applyCoupon(couponCode);
      this.setState({ coupon: resp.data });
      message.success('Coupon is applied');
    } catch (error) {
      const e = await error;
      message.error(e?.message || 'Error occured, please try again later');
    }
  }

  render() {
    const { ui, user } = this.props;
    const {
      list, searching, openPurchaseModal, submiting, couponCode,
      selectedPackage, paymentGateway, coupon, paymentUrl
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            | Token Packages
          </title>
        </Head>
        <div className="main-container">
          <PageHeading title="Token Packages" icon={<WalletOutlined />} />
          <Row>
            {!searching && list.length > 0 && list.map((item: IPackageToken) => (
              <Col md={6} sm={12} xs={24} key={item._id}>
                <Card title={item.name} className="site-card-wrapper">
                  <p className="price-style">
                    $
                    {(item.price || 0).toFixed(2)}
                    {' '}
                    /
                    {' '}
                    <img alt="token" src="/static/coin-ico.png" height="20px" />
                    {' '}
                    {item.tokens || 0}
                  </p>
                  <div className="scrollbar" id="style-3">
                    <div className="force-overflow">{item.description}</div>
                  </div>
                  <Button
                    className="buy-btn"
                    onClick={() => this.setState({
                      openPurchaseModal: true,
                      selectedPackage: item,
                      couponCode: '',
                      coupon: null
                    })}
                  >
                    Buy now
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
          <Modal
            centered
            width={!paymentUrl ? 500 : 990}
            key={`token_package_${selectedPackage?._id}`}
            title={`Purchase Token Package ${selectedPackage?.name}`}
            visible={openPurchaseModal}
            footer={null}
            onCancel={() => this.setState({ openPurchaseModal: false, paymentUrl: '' })}
            destroyOnClose
          >
            {!paymentUrl ? (
              <div className="text-center">
                <div className="tip-performer">
                  <img alt="p-avt" src={user?.avatar || '/static/no-avatar.png'} style={{ width: '100px', borderRadius: '50%' }} />
                  <div>
                    {user?.name || user?.username || 'N/A'}
                  </div>
                </div>
                <div style={{ margin: '20px 0' }}>
                  <Row>
                    <Col span={18}>
                      <Input disabled={!!coupon} placeholder="Enter coupon code here" onChange={(e) => this.setState({ couponCode: e.target.value })} />
                      {coupon && (
                      <small style={{ color: 'red' }}>
                        Discount
                        {' '}
                        {coupon.value * 100}
                        %
                      </small>
                      )}
                    </Col>
                    <Col span={6}>
                      {!coupon ? <Button disabled={!couponCode} onClick={this.applyCoupon.bind(this)}>Apply!</Button>
                        : <Button onClick={() => this.setState({ couponCode: '', coupon: null })}>Use Later!</Button>}
                    </Col>
                  </Row>
                </div>
                {paymentGateway === 'stripe' && !user?.stripeCardIds?.length ? (
                  <Button type="primary" onClick={() => Router.push('/user/cards/add-card')}>
                    Please add a payment card
                  </Button>
                ) : (
                  <Button type="primary" disabled={submiting} loading={submiting} onClick={() => this.purchaseTokenPackage()}>
                    Confirm purchase $
                    {coupon ? (selectedPackage?.price - coupon.value * selectedPackage?.price).toFixed(2) : selectedPackage?.price.toFixed(2)}
                    {' '}
                    /
                    <img alt="token" src="/static/coin-ico.png" height="15px" style={{ margin: '0 3px' }} />
                    {selectedPackage?.tokens}
                  </Button>
                )}
              </div>
            ) : <iframe title="ccbill-paymennt-form" style={{ width: '100%', minHeight: '90vh' }} src={paymentUrl} />}
          </Modal>
          {searching && <div className="text-center" style={{ margin: '30px 0' }}><Spin /></div>}
          {!searching && !list.length && <p className="text-center" style={{ margin: '30px 0' }}>No token package was found</p>}
          {submiting && <Loader customText="We are processing your payment, please do not reload this page until it's done." />}
        </div>
      </Layout>
    );
  }
}

const mapStates = (state) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
  settings: { ...state.settings }
});

export default connect(mapStates)(TokenPackages);
