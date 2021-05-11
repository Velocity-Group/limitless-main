/* eslint-disable no-console */
import Head from 'next/head';
import {
  Layout, message, Row, Col, Card, Button, Modal, Input
} from 'antd';
import { PureComponent } from 'react';
import { tokenPackageService } from '@services/token-package.service';
import { paymentService } from '@services/index';
import './index.less';
import {
  IUIConfig, IPackageToken, IUser
} from '@interfaces/index';
import Loader from '@components/common/base/loader';
import { connect } from 'react-redux';
import { StarOutlined } from '@ant-design/icons';
import Page from '@components/common/layout/page';

interface IProps {
  ui: IUIConfig;
  user: IUser;
}

class TokenPackages extends PureComponent<IProps> {
  static authenticate = true;

  state = {
    searching: false,
    submiting: false,
    list: [] as any,
    couponCode: '',
    isApliedCode: false,
    openPurchaseModal: false,
    selectedPackage: null,
    gateway: 'ccbill',
    coupon: null
  };

  async componentDidMount() {
    this.search();
  }

  onChangeGateway(gateway: string) {
    this.setState({ gateway });
  }

  async search() {
    try {
      await this.setState({ searching: true });
      const resp = await tokenPackageService.search({
        limit: 99
      });
      await this.setState({
        searching: false,
        list: resp.data.data
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      await this.setState({ searching: false });
    }
  }

  async purchaseTokenPackage() {
    const { user } = this.props;
    const {
      isApliedCode, gateway, couponCode, selectedPackage
    } = this.state;
    if (user.isPerformer) return;
    try {
      await this.setState({ submiting: true });
      const pay = await (await paymentService.purchaseTokenPackage(selectedPackage._id, {
        gateway, couponCode: isApliedCode ? couponCode : null
      })).data;
      // TOTO update logic here
      // if (pay.paymentUrl) {
      //   message.success('Redirecting to payment method');
      //   window.location.href = pay.paymentUrl;
      // }
      message.success('Redirecting to payment method');
      window.location.reload();
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
    } finally {
      this.setState({ openPurchaseModal: false, submiting: false });
    }
  }

  async applyCoupon() {
    const { couponCode } = this.state;
    try {
      const resp = await paymentService.applyCoupon(couponCode);
      this.setState({ isApliedCode: true, coupon: resp.data });
      message.success('Coupon is applied');
    } catch (error) {
      const e = await error;
      message.error(e?.message || 'Error occured, please try again later');
    }
  }

  render() {
    const {
      ui, user
    } = this.props;
    const {
      list, searching, openPurchaseModal, submiting,
      selectedPackage, isApliedCode, gateway, coupon
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
          <Page>
            <div
              className="page-heading flex-row-space-between"
              style={{ position: 'relative' }}
            >
              <span>
                <StarOutlined />
                {' '}
                Token Packages
              </span>
            </div>
            <Row>
              {!searching && list.length > 0 && list.map((item: IPackageToken) => (
                <Col md={6} sm={12} xs={24} key={item._id}>
                  <Card title={item.name} className="site-card-wrapper">
                    <p className="price-style">
                      $
                      {item.price.toFixed(2)}
                      {' '}
                      /
                      {' '}
                      <img alt="token" src="/static/coin-ico.png" height="20px" />
                      {' '}
                      {item.tokens}
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
                        coupon: null,
                        isApliedCode: false
                      })}
                    >
                      Buy now
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </Page>
          <Modal
            key={`token_package_${selectedPackage?._id}`}
            title={`Purchase Token Package ${selectedPackage?.name}`}
            visible={openPurchaseModal}
            footer={null}
            onCancel={() => this.setState({ openPurchaseModal: false })}
            destroyOnClose
          >
            <div className="text-center">
              <div className="tip-performer">
                <img alt="p-avt" src={user?.avatar || '/static/no-avatar.png'} style={{ width: '100px', borderRadius: '50%' }} />
                <div>
                  {user?.name || user?.username || 'N/A'}
                </div>
              </div>
              <div style={{ margin: '20px 0' }}>
                {/* <p className="text-center">Please select payment gateway</p> */}
                <div className="payment-gateway">
                  <div aria-hidden onClick={() => this.onChangeGateway('ccbill')} className={gateway === 'ccbill' ? 'gateway-item active' : 'gateway-item'}>
                    <a><img src="/static/ccbill-ico.png" alt="ccbill" width="100%" /></a>
                  </div>
                  {/* <div aria-hidden onClick={() => this.onChangeGateway('bitpay')} className={gateway === 'bitpay' ? 'gateway-item active' : 'gateway-item'}>
                    <a><img src="/static/bitpay-ico.png" alt="bitpay" width="65px" /></a>
                  </div> */}
                </div>
                <Row>
                  <Col span={18}>
                    <Input disabled={isApliedCode} placeholder="Enter coupon code here" onChange={(e) => this.setState({ couponCode: e.target.value })} />
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
                    {!isApliedCode ? <Button onClick={this.applyCoupon.bind(this)}>Apply Code!</Button>
                      : <Button onClick={() => this.setState({ isApliedCode: false, couponCode: '', coupon: null })}>Use Later!</Button>}
                  </Col>
                </Row>
              </div>
              <Button type="primary" disabled={submiting} loading={submiting} onClick={() => this.purchaseTokenPackage()}>
                Confirm purchase $
                {coupon ? (selectedPackage?.price - coupon.value * selectedPackage?.price).toFixed(2) : selectedPackage?.price.toFixed(2)}
                {' '}
                /
                <img alt="token" src="/static/coin-ico.png" height="15px" style={{ margin: '0 3px' }} />
                {selectedPackage?.tokens}
              </Button>
            </div>
          </Modal>
          {searching && <Loader />}
          {!searching && !list.length && <p className="text-center" style={{ margin: '30px 0' }}>No token package found.</p>}
        </div>
      </Layout>
    );
  }
}

const mapStates = (state) => ({
  ui: { ...state.ui },
  user: { ...state.user.current }
});

export default connect(mapStates)(TokenPackages);
