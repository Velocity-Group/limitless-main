import {
  Layout, message, Input, Select, Button, Tag
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { BreadcrumbComponent } from '@components/common/breadcrumb';
import Page from '@components/common/layout/page';
import { orderService } from 'src/services';
import Router from 'next/router';
import { getResponseError } from '@lib/utils';
import { IOrder } from 'src/interfaces';

const { Content } = Layout;

interface IProps {
  id: string;
}

interface IStates {
  order: IOrder;
  shippingCode: string;
  deliveryStatus: string;
  submiting: boolean;
}

class OrderDetailPage extends PureComponent<IProps, IStates> {
  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      order: null,
      shippingCode: '',
      deliveryStatus: '',
      submiting: false
    };
  }

  componentDidMount() {
    this.getData();
  }

  async onUpdate() {
    const { deliveryStatus, shippingCode } = this.state;
    const { id } = this.props;
    if (!shippingCode) {
      message.error('Missing shipping code');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await orderService.update(id, { deliveryStatus, shippingCode });
      message.success('Changes saved.');
      Router.push('/order');
    } catch (e) {
      message.error(getResponseError(e));
      this.setState({ submiting: false });
    }
  }

  async getData() {
    const { id } = this.props;
    try {
      const { data: order } = await orderService.findById(id);
      await this.setState({
        order,
        shippingCode: order.shippingCode,
        deliveryStatus: order.deliveryStatus
      });
    } catch (e) {
      message.error('Can not find order!');
    }
  }

  render() {
    const { order, submiting } = this.state;
    return (
      <Layout>
        <Head>
          <title>Order Details</title>
        </Head>
        <Content>
          <div className="main-container">
            <BreadcrumbComponent
              breadcrumbs={[
                { title: 'Orders', href: '/order' },
                {
                  title: order && order.orderNumber ? `#${order.orderNumber}` : 'Order Details'
                }
              ]}
            />
            <Page>
              {order && (
              <div className="main-container">
                <div style={{ marginBottom: '10px' }}>
                  <strong>Order number</strong>
                  : #
                  {order.orderNumber}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Product name</strong>
                  :
                  {' '}
                  {order?.productInfo?.name || 'N/A'}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Product description</strong>
                  :
                  {' '}
                  {order?.productInfo?.description || 'N/A'}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Product type:</strong>
                  {' '}
                  <Tag color="pink">{order?.productInfo?.type || 'N/A'}</Tag>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Buyer</strong>
                  :
                  {' '}
                  {`${order.userInfo?.name || 'N/A'}  - @${order.userInfo?.username || 'n/a'}`}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Seller</strong>
                  :
                  {' '}
                  {`${order.performerInfo?.name || 'N/A'}  - @${order.performerInfo?.username || 'n/a'}`}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Unit tokens</strong>
                  :
                  {' '}
                  <img src="/coin-ico.png" width="15px" alt="coin" />
                  {(order.unitPrice || 0).toFixed(2)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Quantity</strong>
                  :
                  {' '}
                  {order.quantity}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Total tokens</strong>
                  :
                  {' '}
                  <img src="/coin-ico.png" width="15px" alt="coin" />
                  {(order.totalPrice || 0).toFixed(2)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Delivery Address</strong>
                  :
                  {' '}
                  {order.deliveryAddress || 'N/A'}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Shipping Code</strong>
                  :
                  {' '}
                  <Input placeholder="Enter shipping code here" defaultValue={order.shippingCode} onChange={(e) => this.setState({ shippingCode: e.target.value })} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Delivery Status:</strong>
                  {' '}
                  <Select
                    onChange={(e) => this.setState({ deliveryStatus: e })}
                    defaultValue={order.deliveryStatus}
                    disabled={submiting || order.deliveryStatus === 'refunded'}
                  >
                    <Select.Option key="processing" value="processing" disabled>
                      Processing
                    </Select.Option>
                    <Select.Option key="shipping" value="shipping">
                      Shipped
                    </Select.Option>
                    <Select.Option key="delivered" value="delivered">
                      Delivered
                    </Select.Option>
                    <Select.Option key="refunded" value="refunded">
                      Refunded
                    </Select.Option>
                  </Select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <Button type="primary" onClick={this.onUpdate.bind(this)}>Update</Button>
                  &nbsp;
                  <Button danger onClick={this.onUpdate.bind(this)}>Back</Button>
                </div>
              </div>
              )}
            </Page>
          </div>
        </Content>
      </Layout>
    );
  }
}

export default OrderDetailPage;
