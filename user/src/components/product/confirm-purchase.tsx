import { PureComponent } from 'react';
import {
  Button, Form, Input, message, InputNumber
} from 'antd';
import { IProduct } from '@interfaces/index';

interface IProps {
  submiting: boolean;
  product: IProduct;
  onFinish: Function;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

export class PurchaseProductForm extends PureComponent<IProps> {
  render() {
    const { product, onFinish, submiting } = this.props;
    const image = product?.image || '/static/placeholder-image.jpg';

    return (
      <div className="text-center">
        <div className="tip-performer">
          <img alt="p-avt" src={image} style={{ width: '100px', borderRadius: '5px' }} />
          <h4>
            {product?.name}
          </h4>
          <p>{product?.description}</p>
        </div>
        <Form
          {...layout}
          onFinish={onFinish.bind(this)}
          onFinishFailed={() => message.error('Please complete the required fields')}
          name="form-order"
          initialValues={{
            quantity: 1,
            userNote: '',
            deliveryAddress: '',
            phoneNumber: '+123xxx'
          }}
          className="account-form"
        >
          <Form.Item
            name="quantity"
            rules={[{ required: true, message: 'Please input quantity' }]}
            label="Quantity"
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="deliveryAddress"
            rules={[{ required: true, message: 'Please input delivery address' }]}
            label="Delivery address"
          >
            <Input.TextArea rows={1} />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            label="Phone number"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="userNote"
            label="Note something"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="text-center">
            <Button
              htmlType="submit"
              className="primary"
              type="primary"
              loading={submiting}
              disabled={submiting}
            >
              Confirm to purchase at &nbsp;
              <img alt="token" src="/static/coin-ico.png" height="15px" style={{ margin: '0 3px' }} />
              {(product?.price || 0).toFixed(2)}
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}
