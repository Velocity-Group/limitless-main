import { PureComponent, createRef } from 'react';
import {
  Form, Input, InputNumber, Select, Upload, Button, message, Progress
} from 'antd';
import { IProduct } from 'src/interfaces';
import { UploadOutlined, CameraOutlined } from '@ant-design/icons';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { FormInstance } from 'antd/lib/form';

interface IProps {
  product?: IProduct;
  submit?: Function;
  beforeUpload?: Function;
  uploading?: boolean;
  uploadPercentage?: number;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!'
};

export class FormProduct extends PureComponent<IProps> {
  state = {
    previewImageProduct: null,
    isDigitalProduct: false,
    digitalProductName: ''
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { product } = this.props;
    if (product) {
      this.setState({
        previewImageProduct: product?.image || '',
        isDigitalProduct: product.type === 'digital'
      });
    }
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
    if (field === 'type') {
      this.setState({ isDigitalProduct: val === 'digital' });
    }
  }

  beforeUpload(file, field) {
    const { beforeUpload: handleUpload } = this.props;
    if (field === 'image') {
      const reader = new FileReader();
      reader.addEventListener('load', () => this.setState({ previewImageProduct: reader.result }));
      reader.readAsDataURL(file);
    }
    if (field === 'digitalFile') {
      this.setState({
        digitalProductName: file.name
      });
    }
    handleUpload(file, field);
    return false;
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const {
      product, submit, uploading, uploadPercentage
    } = this.props;
    const { previewImageProduct, isDigitalProduct, digitalProductName } = this.state;
    const haveProduct = !!product;
    return (
      <Form
        {...layout}
        onFinish={submit && submit.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields')}
        name="form-upload"
        ref={this.formRef}
        validateMessages={validateMessages}
        initialValues={
          product || ({
            name: '',
            price: 9.99,
            description: '',
            status: 'active',
            performerId: '',
            stock: 99,
            type: 'physical'
          })
        }
      >
        <Form.Item name="performerId" label="Model" rules={[{ required: true }]}>
          <SelectPerformerDropdown
            showAll
            placeholder="Select model"
            disabled={haveProduct}
            defaultValue={product && product.performerId}
            onSelect={(val) => this.setFormVal('performerId', val)}
          />
        </Form.Item>
        <Form.Item name="name" rules={[{ required: true, message: 'Please input name of product!' }]} label="Name">
          <Input placeholder="Enter product name" />
        </Form.Item>
        <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Please select type!' }]}>
          <Select onChange={(val) => this.setFormVal('type', val)}>
            <Select.Option key="physical" value="physical">
              Physical
            </Select.Option>
            <Select.Option key="digital" value="digital">
              Digital
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="price" label="Amount of Tokens">
          <InputNumber min={1} />
        </Form.Item>
        {!isDigitalProduct && (
        <Form.Item name="stock" label="Stock">
          <InputNumber min={1} />
        </Form.Item>
        )}
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Image">
          <Upload
            accept="image/*"
            listType="picture-card"
            className="avatar-uploader"
            multiple={false}
            showUploadList={false}
            disabled={uploading}
            beforeUpload={(file) => this.beforeUpload(file, 'image')}
          >
            {previewImageProduct && (
              <img src={previewImageProduct} alt="file" width="100%" />
            )}
            <CameraOutlined />
          </Upload>
        </Form.Item>
        {isDigitalProduct && (
          <Form.Item label="Digital file" help={digitalProductName || null}>
            <Upload
              multiple={false}
              listType="picture-card"
              className="avatar-uploader"
              showUploadList
              disabled={uploading || haveProduct}
              beforeUpload={(file) => this.beforeUpload(file, 'digitalFile')}
            >
              <UploadOutlined />
            </Upload>
            {product?.digitalFileId && <div className="ant-form-item-explain" style={{ textAlign: 'left' }}><a download href={product?.digitalFileUrl}>Click to download</a></div>}
            {uploadPercentage ? <Progress percent={uploadPercentage} /> : null}
          </Form.Item>
        )}
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
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={uploading}>
            {haveProduct ? 'Update' : 'Upload'}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
