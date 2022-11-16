import { useEffect, useRef, useState } from 'react';
import {
  Button, Form, Input, message, InputNumber, Select
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { ICountry, IProduct, IAddress } from '@interfaces/index';
import { shippingAddressService } from 'src/services';
import { ShippingAddressForm } from './shipping-address-form';
import './product.less';

interface IProps {
  submiting: boolean;
  product: IProduct;
  onFinish: Function;
  countries: ICountry[];
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

export const PurchaseProductForm = ({
  submiting, product, onFinish, countries
}: IProps) => {
  const image = product?.image || '/static/no-image.jpg';
  const [quantity, setQuantity] = useState(1);
  const [addresses, setAddresses] = useState<any>([]);
  const [isNewAddress, setNewAddress] = useState(false);
  const [loading, setSubmiting] = useState(false);
  const formRef = useRef() as any;

  const handleChangeQuantity = (q: number) => {
    if (q < 1) return;
    if (product.stock < q) {
      message.error('Quantity is out of product stock!');
      return;
    }
    setQuantity(q);
  };

  const getAddresses = async () => {
    const resp = await shippingAddressService.search({ limit: 10 });
    setAddresses(resp?.data?.data || []);
  };

  const addNewAddress = async (payload: any) => {
    try {
      setSubmiting(true);
      const country = countries.find((c) => c.code === payload.country);
      const data = { ...payload, country: country.name };
      const resp = await shippingAddressService.create(data);
      addresses.unshift(resp.data);
      setSubmiting(false);
      setNewAddress(false);
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later!');
      setSubmiting(false);
      setNewAddress(false);
    }
  };

  const deleteAddress = async (id) => {
    try {
      setSubmiting(true);
      await shippingAddressService.delete(id);
      const index = addresses.findIndex((f) => f._id === id);
      addresses.splice(index, 1);
      setSubmiting(false);
      formRef.current.resetFields(['deliveryAddressId']);
    } catch (e) {
      setSubmiting(false);
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later!');
    }
  };

  useEffect(() => {
    getAddresses();
  }, []);

  return (
    <>
      {!isNewAddress && (
      <div className="text-center">
        <h3 className="secondary-color">
          Confirm purchase:
          {' '}
          {product?.name}
        </h3>
        <img alt="p-avt" src={image} style={{ width: '100px', borderRadius: '5px' }} />
      </div>
      )}
      {!isNewAddress && (
      <Form
        ref={formRef}
        {...layout}
        onFinish={onFinish.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields')}
        name="form-order"
        initialValues={{
          quantity: 1,
          userNote: '',
          phoneNumber: ''
        }}
        className="account-form"
      >
        {product.type === 'physical' && (
        <>
          <Form.Item
            name="quantity"
            rules={[{ required: true, message: 'Please input quantity of product' }]}
            label="Quantity"
          >
            <InputNumber onChange={handleChangeQuantity} min={1} max={product.stock} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="deliveryAddressId"
            rules={[{ required: true, message: 'Please select delivery address!' }]}
            label="Delivery address"
          >
            <Button.Group style={{ width: '100%', overflow: 'auto' }}>
              <Select defaultActiveFirstOption onChange={(val: string) => formRef.current.setFieldsValue({ deliveryAddressId: val })}>
                {addresses.map((a: IAddress) => (
                  <Select.Option value={a._id} key={a._id}>
                    <div className="address-option">
                      {a.name}
                      {' '}
                      -
                      {' '}
                      <small>{`${a.streetNumber} ${a.streetAddress}, ${a.ward}, ${a.district}, ${a.city}, ${a.state} (${a.zipCode}), ${a.country}`}</small>
                      <a aria-hidden className="delete-btn" onClick={() => deleteAddress(a._id)}><DeleteOutlined /></a>
                    </div>
                  </Select.Option>
                ))}
              </Select>
              {addresses.length < 10 && <Button onClick={() => setNewAddress(true)} className="primary"><PlusOutlined /></Button>}
            </Button.Group>
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            label="Phone number"
            rules={[
              { required: true, message: 'Please enter your phone number!' },
              {
                pattern: new RegExp(/^([+]\d{2,4})?\d{9,12}$/g), message: 'Please provide valid digit numbers'
              }
            ]}
          >
            <Input placeholder="Phone number (+910123456789)" />
          </Form.Item>
          <Form.Item
            name="userNote"
            label="Comments"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </>
        )}
        <div className="text-center">
          <Button
            htmlType="submit"
            className="primary"
            type="primary"
            loading={submiting}
            disabled={submiting || (product.type === 'physical' && product.stock < quantity)}
          >
            CONFIRM PURCHASE FOR&nbsp;
            $
            {(quantity * product.price).toFixed(2)}
          </Button>
        </div>
      </Form>
      )}
      {isNewAddress && (
      <div className="text-center">
        <h3 className="secondary-color">
          Save your address for the future use
        </h3>
      </div>
      )}
      {isNewAddress && <ShippingAddressForm onCancel={() => setNewAddress(false)} submiting={loading} onFinish={addNewAddress} countries={countries} />}
    </>
  );
};
