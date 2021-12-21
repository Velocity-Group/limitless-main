import { PureComponent } from 'react';
import {
  Form, Input, Button, InputNumber, Select, DatePicker
} from 'antd';
import { ICouponUpdate } from 'src/interfaces';
import moment from 'moment';

interface IProps {
  coupon?: ICouponUpdate;
  onFinish: Function;
  submiting: boolean;
}

function disabledDate(current) {
  return current && current < moment().endOf('day');
}

export class FormCoupon extends PureComponent<IProps> {
  render() {
    const { coupon, onFinish, submiting } = this.props;
    return (
      <Form
        onFinish={onFinish.bind(this)}
        initialValues={
          coupon
            ? { ...coupon, expiredDate: moment(coupon.expiredDate, 'YYYY-MM-DD'), value: coupon.value }
            : ({
              name: '',
              description: '',
              code: '',
              value: 0.1,
              status: 'active',
              expiredDate: '',
              numberOfUses: 1
            })
        }
        layout="vertical"
      >
        <Form.Item name="name" rules={[{ required: true, message: 'Please input name of the coupon' }]} label="Name">
          <Input placeholder="Coupon name" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          name="code"
          label="Code"
          rules={[
            {
              pattern: new RegExp(/^[a-zA-Z0-9]*$/g),
              message: 'Please input alphanumerics only'
            },
            { required: true, message: 'Please input the coupon code' }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="value"
          label="Discount percentage 0.01-0.99 (1% to 99%)"
          rules={[
            { required: true, message: 'Please input percentage value of coupon' }
          ]}
        >
          <InputNumber min={0.01} max={0.99} />
        </Form.Item>
        <Form.Item
          name="numberOfUses"
          label="Maximum number of people who can use this coupon"
          rules={[{ required: true, message: 'Please input number of uses' }]}
        >
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select status!' }]}>
          <Select>
            <Select.Option key="active" value="active">
              Active
            </Select.Option>
            <Select.Option key="inactive" value="inactive">
              Inactive
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="expiredDate"
          label="Expiry Date"
          rules={[{ required: true, message: 'Please input the expiry date of coupon' }]}
        >
          <DatePicker format="YYYY-MM-DD" disabledDate={disabledDate} />
        </Form.Item>
        <Form.Item className="text-center">
          <Button type="primary" htmlType="submit" loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
