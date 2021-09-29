import { PureComponent } from 'react';
import {
  Layout, message, Input, Select, Button,
  Tag, Descriptions, Alert
} from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import Head from 'next/head';
import { IOrder, IUIConfig } from 'src/interfaces';
import { orderService } from 'src/services';
import { connect } from 'react-redux';
import Router from 'next/router';
import { getResponseError } from '@lib/utils';

const { Item } = Descriptions;
interface IProps {
  id: string;
  ui: IUIConfig;
}

interface IStates {
  submiting: boolean;
  order: IOrder;
  shippingCode: string;
  deliveryStatus: string;
}

class OrderDetailPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      submiting: false,
      order: null,
      shippingCode: '',
      deliveryStatus: ''
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
      Router.back();
    } catch (e) {
      message.error(getResponseError(e));
      this.setState({ submiting: false });
    }
  }

  async getData() {
    try {
      const { id } = this.props;
      const order = await orderService.findById(id);
      await this.setState({
        order: order.data,
        shippingCode: order.data.shippingCode,
        deliveryStatus: order.data.deliveryStatus
      });
    } catch (e) {
      message.error('Can not find order!');
      Router.back();
    }
  }

  render() {
    const { ui } = this.props;
    const { order, submiting } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui.siteName} | ${order?.orderNumber || ''}`}
          </title>
        </Head>
        <div className="main-container">
          {order && (
            <div className="main-container">
              <PageHeading title={`${order?.orderNumber}`} icon={<ShoppingCartOutlined />} />
              <Descriptions>
                <Item key="name" label="Product">
                  {order?.productInfo?.name || 'N/A'}
                </Item>
                <Item key="description" label="Description">
                  {order?.productInfo?.name || 'N/A'}
                </Item>
                <Item key="productType" label="Product type">
                  <Tag color="orange" style={{ textTransform: 'capitalize' }}>{order?.productInfo?.type || 'N/A'}</Tag>
                </Item>
                <Item key="unitPrice" label="Unit price">
                  <img src="/static/coin-ico.png" width="20px" alt="coin" />
                  {order?.unitPrice}
                </Item>
                <Item key="quantiy" label="Quantity">
                  {order?.quantity || '0'}
                </Item>
                <Item key="originalPrice" label="Total Price">
                  <img src="/static/coin-ico.png" width="20px" alt="coin" />
                  {order?.totalPrice}
                </Item>
              </Descriptions>
              {order?.productInfo?.type === 'physical'
                ? (
                  <>
                    <div style={{ marginBottom: '10px' }}>
                      Delivery Address:
                      {' '}
                      {order.deliveryAddress || 'N/A'}
                    </div>
                    <Alert type="warning" message="Update shipping code & delivery status below!" />
                    <div style={{ marginBottom: '10px' }}>
                      Shipping Code:
                      <Input
                        placeholder="Enter shipping code here"
                        defaultValue={order.shippingCode}
                        onChange={(e) => this.setState({ shippingCode: e.target.value })}
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      Delivery Status:
                      {' '}
                      <Select
                        onChange={(e) => {
                          this.setState({ deliveryStatus: e });
                        }}
                        defaultValue={order.deliveryStatus}
                        disabled={submiting || order.deliveryStatus === 'refunded'}
                        style={{ minWidth: '120px' }}
                      >
                        <Select.Option key="processing" value="processing">
                          Processing
                        </Select.Option>
                        <Select.Option key="shipping" value="shipping">
                          Shipping
                        </Select.Option>
                        <Select.Option key="delivered" value="delivered">
                          Delivered
                        </Select.Option>
                        <Select.Option key="refunded" value="refunded" disabled={order.deliveryStatus !== 'delivered'}>
                          Refunded
                        </Select.Option>
                      </Select>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <Button className="primary" onClick={this.onUpdate.bind(this)} loading={submiting} disabled={submiting}>
                        Update
                      </Button>
                      <Button className="secondary" onClick={() => Router.back()} disabled={submiting}>
                        Back
                      </Button>
                    </div>
                  </>
                ) : (
                  <div style={{ marginBottom: '10px' }}>
                    Delivery Status:
                    {' '}
                    <Tag color="green">Delivered</Tag>
                  </div>
                )}
            </div>
          )}
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui
});

export default connect(mapStates)(OrderDetailPage);
