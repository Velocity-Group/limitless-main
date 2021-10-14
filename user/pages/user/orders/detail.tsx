import { PureComponent } from 'react';
import {
  Layout, message, Button, Descriptions, Tag, Spin, Divider
} from 'antd';
import {
  ShoppingCartOutlined
} from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import Head from 'next/head';
import { IOrder, IUIConfig } from 'src/interfaces';
import { orderService } from 'src/services';
import { connect } from 'react-redux';
import Router from 'next/router';

const { Item } = Descriptions;

interface IProps {
  id: string;
  ui: IUIConfig;
}

interface IStates {
  order: IOrder;
  loading: boolean;
}

class OrderDetailPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static async getInitialProps({ ctx }) {
    return ctx.query;
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      loading: false,
      order: null
    };
  }

  componentDidMount() {
    this.getData();
  }

  async getData() {
    try {
      const { id } = this.props;
      await this.setState({ loading: true });
      const order = await orderService.findById(id);
      await this.setState({
        order: order?.data,
        loading: false
      });
    } catch (e) {
      message.error('Can not find order!');
      Router.back();
    }
  }

  async downloadFile() {
    const { order } = this.state;
    try {
      const resp = await orderService.getDownloadLinkDigital(order.productId);
      window.open(resp?.data?.downloadLink, '_blank');
    } catch {
      message.error('Error occured, please try again later');
    }
  }

  render() {
    const { ui } = this.props;
    const { order, loading } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName} | #${order?.orderNumber || ''}`}
          </title>
        </Head>
        <div className="main-container">
          {!loading && order && (
            <div className="main-container">
              <PageHeading title={`#${order?.orderNumber}`} icon={<ShoppingCartOutlined />} />
              <Descriptions>
                <Item key="seller" label="Model">
                  {order?.performerInfo?.name || order?.performerInfo?.username || 'N/A'}
                </Item>
                <Item key="name" label="Product">
                  {order?.productInfo?.name || 'N/A'}
                </Item>
                <Item key="description" label="Description">
                  {order?.productInfo?.description || 'N/A'}
                </Item>
                <Item key="unitPrice" label="Unit price">
                  <img alt="coin" src="/static/coin-ico.png" width="20px" />
                  {(order?.unitPrice || 0).toFixed(2)}
                </Item>
                <Item key="quantiy" label="Quantity">
                  {order?.quantity || '0'}
                </Item>
                <Item key="totalPrice" label="Total Price">
                  <img alt="coin" src="/static/coin-ico.png" width="20px" />
                  {(order?.totalPrice || 0).toFixed(2)}
                </Item>
              </Descriptions>
              {order?.productInfo?.type === 'digital' ? (
                <>
                  {order?.deliveryStatus === 'delivered' ? (
                    <div style={{ marginBottom: '10px' }}>
                      Download Link:
                      {' '}
                      <a aria-hidden onClick={this.downloadFile.bind(this)}>Click to download</a>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '10px', textTransform: 'capitalize' }}>
                      Delivery Status:
                      {' '}
                      <Tag color="green">{order?.deliveryStatus || 'N/A'}</Tag>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <Divider>Delivery information</Divider>
                  <div style={{ marginBottom: '10px' }}>
                    Delivery Address:
                    {' '}
                    {order?.deliveryAddress || 'N/A'}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    Phone Number:
                    {' '}
                    {order?.phoneNumber || 'N/A'}
                  </div>
                  <div style={{ marginBottom: '10px', textTransform: 'capitalize' }}>
                    Shipping Code:
                    {' '}
                    <Tag color="blue">{order?.shippingCode || 'N/A'}</Tag>
                  </div>
                  <div style={{ marginBottom: '10px', textTransform: 'capitalize' }}>
                    Delivery Status:
                    {' '}
                    <Tag color="green">{order?.deliveryStatus || 'N/A'}</Tag>
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '10px' }}>
                <Button danger onClick={() => Router.back()}>
                  Back
                </Button>
              </div>
            </div>
          )}
          {loading && <div><Spin /></div>}
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui
});

export default connect(mapStates)(OrderDetailPage);
