import { PureComponent } from 'react';
import {
  Layout, message, Button, Descriptions, Tag, Spin, Divider, Select, Modal
} from 'antd';
import {
  ShoppingCartOutlined, EditOutlined, PlusOutlined
} from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import Head from 'next/head';
import {
  IOrder, IUIConfig, IAddress, ICountry
} from 'src/interfaces';
import { orderService, shippingAddressService, utilsService } from 'src/services';
import { connect } from 'react-redux';
import Router from 'next/router';
import { injectIntl, IntlShape } from 'react-intl';
import { ShippingAddressForm } from '@components/product/shipping-address-form';

const { Item } = Descriptions;

interface IProps {
  id: string;
  ui: IUIConfig;
  intl: IntlShape;
  countries: ICountry[];
}

interface IStates {
  order: IOrder;
  loading: boolean;
  addresses: IAddress[];
  onEditAddress: boolean;
  submiting: boolean;
  openAddAddressModal: boolean;
}

class OrderDetailPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static async getInitialProps({ ctx }) {
    const { query } = ctx;
    try {
      const [countries] = await Promise.all([
        utilsService.countriesList()
      ]);
      return {
        id: query.id,
        countries: countries.data
      };
    } catch (e) {
      return { error: await e };
    }
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      loading: false,
      order: null,
      addresses: [],
      onEditAddress: false,
      submiting: false,
      openAddAddressModal: false
    };
  }

  componentDidMount() {
    this.getData();
    this.getAddresses();
  }

  getData = async () => {
    const { intl } = this.props;

    try {
      const { id } = this.props;
      await this.setState({ loading: true });
      const order = await orderService.findById(id);
      await this.setState({
        order: order?.data,
        loading: false
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

  downloadFile = async () => {
    const { intl } = this.props;

    const { order } = this.state;
    try {
      const resp = await orderService.getDownloadLinkDigital(order.productId);
      window.open(resp?.data?.downloadLink, '_blank');
    } catch {
      message.error(
        intl.formatMessage({
          id: 'errorOccurredPleaseTryAgainLater',
          defaultMessage: 'Error occurred, please try again later'
        })
      );
    }
  }

  getAddresses = async () => {
    const resp = await shippingAddressService.search({ limit: 10 });
    this.setState({ addresses: resp?.data?.data || [] });
  };

  onUpdateDeliveryAddress = async (deliveryAddressId: string) => {
    const { order } = this.state;
    try {
      const resp = await orderService.updateDeliveryAddress(order._id, { deliveryAddressId });
      this.setState({
        onEditAddress: false,
        order: {
          ...order,
          deliveryAddressId: resp.data.deliveryAddressId,
          deliveryAddress: resp.data.deliveryAddress
        }
      });
      message.success('Updated delivery address successfully!');
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later!');
      this.setState({ onEditAddress: false });
    }
  }

  addNewAddress = async (payload: any) => {
    const { countries } = this.props;
    const { addresses } = this.state;
    try {
      this.setState({ submiting: true });
      const country = countries.find((c) => c.code === payload.country);
      const data = { ...payload, country: country.name };
      const resp = await shippingAddressService.create(data);
      this.setState({
        submiting: false,
        openAddAddressModal: false,
        addresses: [...[resp.data], ...addresses]
      });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later!');
      this.setState({ submiting: false, openAddAddressModal: false });
    }
  };

  deleteAddress = async (id) => {
    const { addresses } = this.state;
    try {
      this.setState({ submiting: true });
      await shippingAddressService.delete(id);
      const index = addresses.findIndex((f) => f._id === id);
      addresses.splice(index, 1);
      this.setState({
        submiting: false,
        addresses: addresses.filter((a) => a._id !== id)
      });
    } catch (e) {
      this.setState({ submiting: false });
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later!');
    }
  };

  render() {
    const { ui, countries, intl } = this.props;
    const {
      order, loading, addresses, onEditAddress, submiting, openAddAddressModal
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>{`${ui?.siteName} | #${order?.orderNumber || ''}`}</title>
        </Head>
        <div className="main-container">
          {!loading && order && (
            <div className="main-container">
              <PageHeading
                title={`#${order?.orderNumber}`}
                icon={<ShoppingCartOutlined />}
              />
              <Descriptions>
                <Item
                  key="seller"
                  label={intl.formatMessage({
                    id: 'model',
                    defaultMessage: 'Model'
                  })}
                >
                  {order?.performerInfo?.name
                    || order?.performerInfo?.username
                    || 'N/A'}
                </Item>
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
                  {order?.productInfo?.description || 'N/A'}
                </Item>
                <Item
                  key="unitPrice"
                  label={intl.formatMessage({
                    id: 'unitPrice',
                    defaultMessage: 'Unit price'
                  })}
                >
                  $
                  {(order?.unitPrice || 0).toFixed(2)}
                </Item>
                <Item
                  key="quantiy"
                  label={intl.formatMessage({
                    id: 'quantity',
                    defaultMessage: 'Quantity'
                  })}
                >
                  {order?.quantity || '0'}
                </Item>
                <Item
                  key="totalPrice"
                  label={intl.formatMessage({
                    id: 'totalPrice',
                    defaultMessage: 'Total Price'
                  })}
                >
                  $
                  {(order?.totalPrice || 0).toFixed(2)}
                </Item>
              </Descriptions>
              {order?.productInfo?.type === 'digital' ? (
                <>
                  {order?.deliveryStatus === 'delivered' ? (
                    <div style={{ marginBottom: '10px' }}>
                      {intl.formatMessage({
                        id: 'downloadLink',
                        defaultMessage: 'Download link'
                      })}
                      :
                      {' '}
                      <a aria-hidden onClick={this.downloadFile.bind(this)}>
                        {intl.formatMessage({
                          id: 'clickToDownload',
                          defaultMessage: 'Click to download'
                        })}
                      </a>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginBottom: '10px',
                        textTransform: 'capitalize'
                      }}
                    >
                      {intl.formatMessage({
                        id: 'deliveryStatus',
                        defaultMessage: 'Delivery Status'
                      })}
                      :
                      {' '}
                      <Tag color="green">{order?.deliveryStatus || 'N/A'}</Tag>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <Divider>
                    {intl.formatMessage({
                      id: 'deliveryInformation',
                      defaultMessage: 'Delivery Information'
                    })}
                  </Divider>
                  <div style={{ marginBottom: '10px' }}>
                    {intl.formatMessage({
                      id: 'deliveryAddress',
                      defaultMessage: 'Delivery Address'
                    })}
                    :
                    {' '}
                    {!onEditAddress ? order?.deliveryAddress : (
                      <Select
                        style={{ minWidth: 250 }}
                        defaultValue={order?.deliveryAddressId}
                        onChange={(id) => this.onUpdateDeliveryAddress(id)}
                      >
                        {addresses.map((a: IAddress) => (
                          <Select.Option value={a._id} key={a._id}>
                            <div style={{ position: 'relative', paddingRight: 30 }}>
                              {a.name}
                              {' '}
                              -
                              {' '}
                              <small>{`${a.streetNumber} ${a.streetAddress}, ${a.ward}, ${a.district}, ${a.city}, ${a.state} (${a.zipCode}), ${a.country}`}</small>
                              {/* <a style={{ position: 'absolute', right: 0 }} aria-hidden onClick={() => this.deleteAddress(a._id)}><DeleteOutlined /></a> */}
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                     &nbsp;&nbsp;
                    {order?.deliveryStatus === 'processing' && (
                    <>
                      {!onEditAddress ? (
                        <a aria-hidden onClick={() => this.setState({ onEditAddress: true })}>
                          <EditOutlined />
                          {' '}
                          {intl.formatMessage({ id: 'change', defaultMessage: 'Change' })}
                        </a>
                      ) : (
                        <>
                          {addresses.length < 10 && (
                          <a aria-hidden onClick={() => this.setState({ openAddAddressModal: true })}>
                            <PlusOutlined />
                            {' '}
                            {intl.formatMessage({ id: 'addNewAddress', defaultMessage: 'Add New Address' })}
                          </a>
                          )}
                        </>
                      )}
                    </>
                    )}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    {intl.formatMessage({
                      id: 'phoneNumber',
                      defaultMessage: 'Phone Number'
                    })}
                    :
                    {' '}
                    {order?.phoneNumber || 'N/A'}
                  </div>
                  <div
                    style={{
                      marginBottom: '10px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {intl.formatMessage({
                      id: 'shippingCode',
                      defaultMessage: 'Shipping Code'
                    })}
                    :
                    {' '}
                    <Tag color="blue">{order?.shippingCode || 'N/A'}</Tag>
                  </div>
                  <div
                    style={{
                      marginBottom: '10px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {intl.formatMessage({
                      id: 'deliveryStatus',
                      defaultMessage: 'Delivery Status'
                    })}
                    :
                    {' '}
                    <Tag color="green">{order?.deliveryStatus || 'N/A'}</Tag>
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '10px' }}>
                <Button danger onClick={() => Router.back()}>
                  {intl.formatMessage({
                    id: 'back',
                    defaultMessage: 'Back'
                  })}
                </Button>
              </div>
            </div>
          )}
          {loading && <div className="text-center" style={{ margin: 30 }}><Spin /></div>}
        </div>
        <Modal
          key="add-new-address"
          width={660}
          title={null}
          visible={openAddAddressModal}
          onOk={() => this.setState({ openAddAddressModal: false })}
          footer={null}
          onCancel={() => this.setState({ openAddAddressModal: false })}
          destroyOnClose
          centered
        >
          <ShippingAddressForm
            onCancel={() => this.setState({ openAddAddressModal: false })}
            submiting={submiting}
            onFinish={this.addNewAddress}
            countries={countries}
          />
        </Modal>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui
});

export default injectIntl(connect(mapStates)(OrderDetailPage));
