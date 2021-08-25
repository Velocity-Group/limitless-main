import { PureComponent, createRef } from 'react';
import {
  Form, Input, Button, Select, InputNumber, Switch
} from 'antd';
import { IGalleryCreate, IGalleryUpdate } from 'src/interfaces';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { FormInstance } from 'antd/lib/form';

interface IProps {
  gallery?: IGalleryUpdate;
  onFinish: Function;
  submiting?: boolean;
}

export class FormGallery extends PureComponent<IProps> {
  formRef: any;

  state = {
    isSale: false
  }

  componentDidMount() {
    const { gallery } = this.props;
    gallery && this.setState({ isSale: gallery.isSale });
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { gallery, onFinish, submiting } = this.props;
    const { isSale } = this.state;
    return (
      <Form
        ref={this.formRef}
        onFinish={onFinish.bind(this)}
        initialValues={
          gallery || ({
            title: '',
            description: '',
            price: 9.99,
            status: 'active',
            performerId: ''
          } as IGalleryCreate)
        }
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
      >
        <Form.Item name="performerId" label="Model" rules={[{ required: true }]}>
          <SelectPerformerDropdown
            showAll
            defaultValue={gallery && gallery.performerId}
            onSelect={(val) => this.setFormVal('performerId', val)}
          />
        </Form.Item>
        <Form.Item name="title" rules={[{ required: true, message: 'Please input title of gallery!' }]} label="Gallery Title">
          <Input />
        </Form.Item>
        <Form.Item name="isSale" label="For sale?" valuePropName="checked">
          <Switch unCheckedChildren="Subscribe to view" checkedChildren="Pay per view" checked={isSale} onChange={(val) => this.setState({ isSale: val })} />
        </Form.Item>
        {isSale && (
        <Form.Item name="price" label="Amount of Tokens">
          <InputNumber min={1} />
        </Form.Item>
        )}
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
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
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={submiting} loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
