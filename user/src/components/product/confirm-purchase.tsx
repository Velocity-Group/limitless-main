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
  state = {
    quantity: 1
  }

  handleChangeQuantity = (quantity: number) => {
    const { product } = this.props;
    if (quantity < 1) return;
    if (product.stock < quantity) {
      message.error('Quantity is out of product stock!');
      return;
    }
    this.setState({ quantity });
  }

  render() {
    const { product, onFinish, submiting } = this.props;
    const { quantity } = this.state;
    const image = product?.image || '/static/no-image.jpg';

    return (
      <div className="text-center">
        <div className="tip-performer">
          <h3 className="secondary-color">
            Confirm purchase:
            {' '}
            {product?.name}
          </h3>
          <img alt="p-avt" src={image} style={{ width: '100px', borderRadius: '5px' }} />
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
          {product.type === 'physical' && (
          <div>
            <Form.Item
              name="quantity"
              rules={[{ required: true, message: 'Please input quantity of product' }]}
              label="Quantity"
            >
              <InputNumber onChange={this.handleChangeQuantity} min={1} max={product.stock} style={{ width: '100%' }} />
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
              rules={[
                {
                  pattern: new RegExp(/^([+]\d{2,4})?\d{9,12}$/g), message: 'Please provide valid digit numbers'
                }
              ]}
            >
              <Input placeholder="Enter valid phone number (+910123456789)" />
            </Form.Item>
            <Form.Item
              name="userNote"
              label="Comments"
            >
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>
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
              <img alt="token" src="/static/coin-ico.png" height="15px" style={{ margin: '0 2px' }} />
              {(quantity * product.price).toFixed(2)}
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}
