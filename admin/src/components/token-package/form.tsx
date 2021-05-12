import { PureComponent } from 'react';
import {
  Form, Input, Button, InputNumber, Switch
} from 'antd';
import { IToken } from 'src/interfaces/token-package';

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 16 }
};
interface IProps {
  packageToken: IToken;
  onFinish: Function;
  submitting?: boolean;
}
export default class FormTokenPackage extends PureComponent<IProps> {
  render() {
    const { submitting, onFinish, packageToken } = this.props;
    return (
      <Form
        {...layout}
        onFinish={onFinish.bind(this)}
        initialValues={
          packageToken || {
            isActive: true
          } as IToken
        }
        layout="vertical"
      >
        <Form.Item name="name" rules={[{ required: true, message: 'Please input name of token package!' }]} label="Name">
          <Input placeholder="Enter token package name" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="price" label="Price">
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="tokens" label="Token">
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="isActive" label="Status">
          <Switch
            defaultChecked={packageToken && packageToken.isActive ? packageToken.isActive : false}
            checkedChildren="Activate"
            unCheckedChildren="Inactivate"
          />
        </Form.Item>
        <Form.Item name="ordering" label="Ordering">
          <InputNumber />
        </Form.Item>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
