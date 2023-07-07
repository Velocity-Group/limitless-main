import { useRef, useState } from 'react';
import {
  Row, Col, Button, Form, InputNumber, Select, FormInstance
} from 'antd';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

interface IProps {
  onClose: Function;
  onFinish: Function;
  price: number;
  isSale: boolean;
}

export const MessagePriceForm = ({
  onClose, onFinish, price, isSale
}: IProps) => {
  const [_isSale, setSale] = useState(isSale.toString());

  const formRef = useRef() as any;

  const onChangeSale = (val) => {
    const instance = formRef.current as FormInstance;
    setSale(val);
    val === 'false' && instance.setFieldsValue({ price: null });
    val === 'true' && instance.setFieldsValue({ price: 20 });
  };

  return (
    <Form
      ref={formRef}
      {...layout}
      name="price-message-form"
      className="price-message-form"
      onFinish={(data) => {
        if (data.isSale === 'false') {
          // eslint-disable-next-line no-param-reassign
          data.price = 0;
        }
        onFinish({
          price: data.price,
          isSale: data.isSale === 'true'
        });
      }}
      initialValues={{
        price,
        isSale: isSale.toString()
      }}
    >
      <Row>
        <Col span={24} className="form-lb">Message type</Col>
        <Col span={18} style={{ padding: '5px 0' }}>
          <Form.Item name="isSale">
            <Select onChange={(val) => onChangeSale(val)}>
              <Select.Option key="true" value="true">Pay - Charge for content</Select.Option>
              <Select.Option key="false" value="false">Public - Everyone can access</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6} style={{ padding: '5px 0' }}>
          <Form.Item
            name="price"
            style={{ width: '100%' }}
            rules={[
              { required: _isSale === 'true', message: 'Add price' }
            ]}
          >
            <InputNumber placeholder="$" style={{ width: '100%' }} disabled={_isSale === 'false'} min={1} />
          </Form.Item>
        </Col>
      </Row>
      <div className="btn-grps">
        <Button
          className="secondary"
          onClick={() => onClose()}
        >
          Cancel
        </Button>
        <Button
          className="primary"
          htmlType="submit"
        >
          Save
        </Button>
      </div>
    </Form>
  );
};

export default MessagePriceForm;
