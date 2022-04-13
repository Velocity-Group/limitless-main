import { PureComponent } from 'react';
import {
  Form, Button, message, InputNumber
} from 'antd';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!'
};

interface IProps {
  onFinish: Function;
  commissionSetting?: any;
  submiting?: boolean;
}

export class CommissionSettingForm extends PureComponent<IProps> {
  render() {
    const { commissionSetting, onFinish, submiting } = this.props;
    return (
      <Form
        layout="vertical"
        name="form-performer"
        onFinish={onFinish.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields.')}
        validateMessages={validateMessages}
        initialValues={
          commissionSetting || ({
            monthlySubscriptionCommission: 0,
            yearlySubscriptionCommission: 0,
            videoSaleCommission: 0,
            productSaleCommission: 0,
            gallerySaleCommission: 0,
            streamCommission: 0,
            tipCommission: 0,
            feedSaleCommission: 0
          })
        }
      >
        <Form.Item name="monthlySubscriptionCommission" label="Monthly Sub commission" help="Value is from 0 - 0.99 (1% - 99%)">
          <InputNumber min={0} max={0.99} style={{ width: '100%' }} step={0.01} />
        </Form.Item>
        <Form.Item name="yearlySubscriptionCommission" label="Yearly Sub commission">
          <InputNumber min={0} max={0.99} style={{ width: '100%' }} step={0.01} />
        </Form.Item>
        <Form.Item name="streamCommission" label="Streaming commission">
          <InputNumber min={0} max={0.99} style={{ width: '100%' }} step={0.01} />
        </Form.Item>
        <Form.Item name="tipCommission" label="Tip commission">
          <InputNumber min={0} max={0.99} style={{ width: '100%' }} step={0.01} />
        </Form.Item>
        <Form.Item name="feedSaleCommission" label="Feed sale commission">
          <InputNumber min={0} max={0.99} style={{ width: '100%' }} step={0.01} />
        </Form.Item>
        <Form.Item name="productSaleCommission" label="Product sale commission">
          <InputNumber min={0} max={0.99} style={{ width: '100%' }} step={0.01} />
        </Form.Item>
        <Form.Item name="videoSaleCommission" label="Video sale commission">
          <InputNumber min={0} max={0.99} style={{ width: '100%' }} step={0.01} />
        </Form.Item>
        <Form.Item name="gallerySaleCommission" label="Gallery sale commission">
          <InputNumber min={0} max={0.99} style={{ width: '100%' }} step={0.01} />
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
