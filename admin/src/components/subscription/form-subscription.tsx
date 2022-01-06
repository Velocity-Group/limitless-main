import { PureComponent, createRef } from 'react';
import {
  Form, Button, Select, DatePicker
} from 'antd';
import { ISubscriptionCreate } from 'src/interfaces';
import { FormInstance } from 'antd/lib/form';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { SelectUserDropdown } from '@components/user/common/select-user-dropdown';
import moment from 'moment';

interface IProps {
  onFinish: Function;
  submiting?: boolean;
}
function disabledDate(current) {
  return current && current < moment().endOf('day');
}
export class FormSubscription extends PureComponent<IProps> {
  formRef: any;

  timeout = 0;

  state = {
    isDisabledExpired: false
  }

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
  }

  onTypeChange(val: 'free' | 'monthly' | 'yearly') {
    if (val === 'free') {
      this.setState({ isDisabledExpired: false });
      return;
    }
    const instance = this.formRef.current as FormInstance;
    if (val === 'monthly') {
      instance.setFieldsValue({
        expiredAt: moment().add(1, 'M')
      });
    }

    if (val === 'yearly') {
      instance.setFieldsValue({
        expiredAt: moment().add(1, 'y')
      });
    }
    this.setState({ isDisabledExpired: true });
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  disableExpiredField = () => {
    const instance = this.formRef.current as FormInstance;
    if (instance.getFieldValue('subscriptionType') === 'free') return false;
    return true;
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { onFinish, submiting } = this.props;
    const { isDisabledExpired } = this.state;
    return (
      <Form
        ref={this.formRef}
        onFinish={onFinish.bind(this)}
        initialValues={
          {
            subscriptionType: 'free',
            userId: '',
            performerId: '',
            status: 'active',
            expiredAt: ''
          } as ISubscriptionCreate
        }
        layout="vertical"
      >
        <Form.Item name="subscriptionType" label="Type" rules={[{ required: true, message: 'Please select type!' }]}>
          <Select onChange={(val: 'free' | 'monthly' | 'yearly') => this.onTypeChange(val)}>
            <Select.Option key="free" value="free">
              Free
            </Select.Option>
            <Select.Option key="monthly" value="monthly">
              Monthly
            </Select.Option>
            <Select.Option key="yearly" value="yearly">
              Yearly
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="userId" label="User" rules={[{ required: true }]}>
          <SelectUserDropdown onSelect={(val) => this.setFormVal('userId', val)} showAll />
        </Form.Item>
        <Form.Item name="performerId" label="Performer" rules={[{ required: true }]}>
          <SelectPerformerDropdown onSelect={(val) => this.setFormVal('performerId', val)} />
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
          name="expiredAt"
          label="Expried Date"
          rules={[{ required: true, message: 'Please input select expried date of subscription!' }]}
        >
          <DatePicker format="YYYY-MM-DD" disabledDate={disabledDate} disabled={isDisabledExpired} />
        </Form.Item>
        <Form.Item wrapperCol={{ span: 20, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
