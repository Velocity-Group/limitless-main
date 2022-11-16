import { PureComponent } from 'react';
import {
  Form, Button, message, InputNumber
} from 'antd';
import { IPerformer } from 'src/interfaces';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!'
};

interface IProps {
  onFinish: Function;
  performer: IPerformer;
  submiting: boolean;
}

export class CommissionSettingForm extends PureComponent<IProps> {
  render() {
    const { performer, onFinish, submiting } = this.props;
    return (
      <Form
        layout="vertical"
        name="form-performer"
        onFinish={onFinish.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields.')}
        validateMessages={validateMessages}
        initialValues={{
          commissionPercentage: performer?.commissionPercentage || 0
        }}
      >
        <Form.Item name="commissionPercentage" label="Commission Percentage" help="Value is from 0.01 to 0.99 (1% - 99%)">
          <InputNumber min={0.01} max={0.99} style={{ width: '100%' }} step={0.01} />
        </Form.Item>
        <Form.Item wrapperCol={{ ...layout.wrapperCol }}>
          <Button type="primary" htmlType="submit" disabled={submiting} loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
