import { PureComponent } from 'react';
import {
  Form, Input, Button, InputNumber, Switch
} from 'antd';
import { ITokenPackage } from 'src/interfaces/token-package';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};
interface IProps {
  packageToken: ITokenPackage;
  onFinish: Function;
  submiting?: boolean;
}
export default class FormTokenPackage extends PureComponent<IProps> {
  render() {
    const { submiting, onFinish, packageToken } = this.props;
    return (
      <Form
        {...layout}
        onFinish={onFinish.bind(this)}
        initialValues={
          packageToken || {
            isActive: true,
            name: '',
            description: '',
            ordering: 0,
            tokens: 99,
            price: 9.99
          }
        }
        layout="vertical"
      >
        <Form.Item name="name" rules={[{ required: true, message: 'Please input token package name' }]} label="Name">
          <Input placeholder="Token package name" />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please input description!' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="price" label="Price ($)" rules={[{ required: true, message: 'Please input the price!' }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="tokens" label="Amount of Tokens" rules={[{ required: true, message: 'Please input amount of tokens!' }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="isActive" label="Status" valuePropName="checked">
          <Switch
            checkedChildren="Activate"
            unCheckedChildren="Deactivate"
          />
        </Form.Item>
        <Form.Item name="ordering" label="Ordering">
          <InputNumber />
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
