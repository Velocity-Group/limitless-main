import { PureComponent } from 'react';
import {
  Layout,
  message,
  Input,
  Select,
  Button,
  Tag,
  Descriptions,
  Alert
} from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import Head from 'next/head';
import { IOrder, IUIConfig } from 'src/interfaces';
import { orderService } from 'src/services';
import { connect } from 'react-redux';
import Router from 'next/router';
import { getResponseError } from '@lib/utils';
import { injectIntl, IntlShape } from 'react-intl';

const { Item } = Descriptions;
interface IProps {
  id: string;
  ui: IUIConfig;
  intl: IntlShape;
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
    const { id, intl } = this.props;
    if (!shippingCode) {
      message.error(
        intl.formatMessage({
          id: 'missingShippingCode',
          defaultMessage: 'Missing shipping code'
        })
      );
      return;
    }
    try {
      await this.setState({ submiting: true });
      await orderService.update(id, { deliveryStatus, shippingCode });
      message.success(
        intl.formatMessage({
          id: 'changesSaved',
          defaultMessage: 'Changes saved'
        })
      );
      Router.back();
    } catch (e) {
      message.error(getResponseError(e));
      this.setState({ submiting: false });
    }
  }

  async getData() {
    const { id, intl } = this.props;
    try {
      const order = await orderService.findById(id);
      await this.setState({
        order: order.data,
        shippingCode: order.data.shippingCode,
        deliveryStatus: order.data.deliveryStatus
      });
    } catch (e) {
      message.error(
        intl.formatMessage({
          id: 'canNotFindOrder',
          defaultMessage: 'Can not find order!'
        })
      );
      Router.back();
    }
  }

  render() {
    const { ui, intl } = this.props;
    const { order, submiting } = this.state;
    return (
      <Layout>
        <Head>
          <title>{`${ui.siteName} | ${order?.orderNumber || ''}`}</title>
        </Head>
        <div className="main-container">
          {order && (
            <div className="main-container">
              <PageHeading
                title={`${order?.orderNumber}`}
                icon={<ShoppingCartOutlined />}
              />
              <Descriptions>
                <Item
                  key="name"
                  label={intl.formatMessage({
                    id: 'product',
                    defaultMessage: 'Product'
                  })}
                >
                  {order?.productInfo?.name || 'N/A'}
                </Item>
                <Item
                  key="description"
                  label={intl.formatMessage({
                    id: 'description',
                    defaultMessage: 'Description'
                  })}
                >
                  {order?.productInfo?.name || 'N/A'}
                </Item>
                <Item
                  key="productType"
                  label={intl.formatMessage({
                    id: 'productType',
                    defaultMessage: 'Product Type'
                  })}
                >
                  <Tag color="orange" style={{ textTransform: 'capitalize' }}>
                    {order?.productInfo?.type || 'N/A'}
                  </Tag>
                </Item>
                <Item
                  key="unitPrice"
                  label={intl.formatMessage({
                    id: 'unitPrice',
                    defaultMessage: 'Unit Price'
                  })}
                >
                  $
                  {order?.unitPrice}
                </Item>
                <Item key="quantiy" label="Quantity">
                  {order?.quantity || '0'}
                </Item>
                <Item
                  key="originalPrice"
                  label={intl.formatMessage({
                    id: 'totalPrice',
                    defaultMessage: 'Total Price'
                  })}
                >
                  <img src="/static/coin-ico.png" width="20px" alt="coin" />
                  {order?.totalPrice}
                </Item>
              </Descriptions>
              {order?.productInfo?.type === 'physical' ? (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    {intl.formatMessage({
                      id: 'deliveryAddress',
                      defaultMessage: 'Delivery Address'
                    })}
                    :
                    {' '}
                    {order.deliveryAddress || 'N/A'}
                  </div>
                  <Alert
                    type="warning"
                    message={intl.formatMessage({
                      id: 'updateShippingCodeAndDeliveryStatusBelow',
                      defaultMessage:
                        'Update shipping code & delivery status below!'
                    })}
                  />
                  <div style={{ marginBottom: '10px' }}>
                    {intl.formatMessage({
                      id: 'shippingCode',
                      defaultMessage: 'Shipping Code'
                    })}
                    :
                    <Input
                      placeholder={intl.formatMessage({
                        id: 'inputShippingCode',
                        defaultMessage: 'Please input shipping code'
                      })}
                      defaultValue={order.shippingCode}
                      onChange={(e) => this.setState({ shippingCode: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    {intl.formatMessage({
                      id: 'deliveryStatus',
                      defaultMessage: 'Delivery Status'
                    })}
                    :
                    {' '}
                    <Select
                      onChange={(e) => {
                        this.setState({ deliveryStatus: e });
                      }}
                      defaultValue={order.deliveryStatus}
                      disabled={
                        submiting || order.deliveryStatus === 'refunded'
                      }
                      style={{ minWidth: '120px' }}
                    >
                      <Select.Option key="processing" value="processing">
                        {intl.formatMessage({
                          id: 'processing',
                          defaultMessage: 'Processing'
                        })}
                      </Select.Option>
                      <Select.Option key="shipping" value="shipping">
                        {intl.formatMessage({
                          id: 'shipping',
                          defaultMessage: 'Shipping'
                        })}
                      </Select.Option>
                      <Select.Option key="delivered" value="delivered">
                        {intl.formatMessage({
                          id: 'delivered',
                          defaultMessage: 'Delivered'
                        })}
                      </Select.Option>
                      <Select.Option key="refunded" value="refunded">
                        {intl.formatMessage({
                          id: 'refunded',
                          defaultMessage: 'Refunded'
                        })}
                      </Select.Option>
                    </Select>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <Button
                      className="primary"
                      onClick={this.onUpdate.bind(this)}
                      loading={submiting}
                      disabled={submiting}
                    >
                      {intl.formatMessage({
                        id: 'update',
                        defaultMessage: 'Update'
                      })}
                    </Button>
                    <Button
                      className="secondary"
                      onClick={() => Router.back()}
                      disabled={submiting}
                    >
                      {intl.formatMessage({
                        id: 'back',
                        defaultMessage: 'Back'
                      })}
                    </Button>
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '10px' }}>
                  {intl.formatMessage({
                    id: 'deliveryStatus',
                    defaultMessage: 'Delivery Status'
                  })}
                  :
                  {' '}
                  <Tag color="green">
                    {intl.formatMessage({
                      id: 'delivered',
                      defaultMessage: 'Delivered'
                    })}
                  </Tag>
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

export default injectIntl(connect(mapStates)(OrderDetailPage));
