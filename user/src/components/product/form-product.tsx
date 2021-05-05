import { PureComponent, createRef } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  message,
  Progress,
  Row,
  Col
} from 'antd';
import { IProduct, IProductCreate } from 'src/interfaces';
import { FileOutlined, CameraOutlined } from '@ant-design/icons';
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
    isDigitalProduct: false
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { product } = this.props;
    if (product) {
      this.setState({
        isDigitalProduct: product.type === 'digital',
        previewImageProduct: product?.image || '/static/placeholder-image.jpg'
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

  beforeUpload(field, file) {
    const { beforeUpload } = this.props;
    if (field === 'image') {
      const reader = new FileReader();
      reader.addEventListener('load', () => this.setState({ previewImageProduct: reader.result }));
      reader.readAsDataURL(file);
    }
    beforeUpload && beforeUpload(file, field);
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const {
      product, submit, uploading, uploadPercentage
    } = this.props;
    const {
      previewImageProduct,
      isDigitalProduct
    } = this.state;
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
            price: 1,
            description: '',
            status: 'active',
            performerId: '',
            stock: 1,
            type: 'physical'
          } as IProductCreate)
        }
        className="account-form"
      >
        <Row>
          <Col md={12} xs={24}>
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Please input name of product!' }]}
              label="Name"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="price"
              label="Amount of tokens"
              rules={[{ required: true, message: 'Amount of tokens is required!' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            {!isDigitalProduct && (
            <Form.Item name="stock" label="Stock" rules={[{ required: true, message: 'Stock is required!' }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            )}
            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: 'Please select type!' }]}
            >
              <Select onChange={(val) => this.setFormVal('type', val)}>
                <Select.Option key="physical" value="physical">
                  Physical
                </Select.Option>
                <Select.Option key="digital" value="digital">
                  Digital
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status!' }]}
            >
              <Select>
                <Select.Option key="active" value="active">
                  Active
                </Select.Option>
                <Select.Option key="inactive" value="inactive">
                  Inactive
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col md={12} xs={24}>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="Image">
              <div>
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  className="avatar-uploader"
                  multiple={false}
                  showUploadList={false}
                  disabled={uploading}
                  beforeUpload={this.beforeUpload.bind(this, 'image')}
                >
                  {previewImageProduct && (
                    <img
                      src={previewImageProduct}
                      alt="file"
                      style={{ width: '100px' }}
                    />
                  )}
                  <CameraOutlined />
                </Upload>
              </div>
            </Form.Item>
            {isDigitalProduct && (
              <Form.Item label="Digital file">
                <div>
                  <Upload
                    listType="picture-card"
                    className="avatar-uploader"
                    multiple={false}
                    showUploadList
                    disabled={uploading || !!product.digitalFileId}
                    beforeUpload={this.beforeUpload.bind(this, 'digitalFile')}
                  >
                    <FileOutlined />
                    {' '}
                    {product.digitalFileId && 'File existed'}
                  </Upload>
                  {uploadPercentage ? (
                    <Progress percent={Math.round(uploadPercentage)} />
                  ) : null}
                </div>
              </Form.Item>
            )}
          </Col>
        </Row>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button
            className="primary"
            type="primary"
            htmlType="submit"
            loading={uploading}
            disabled={uploading}
          >
            {haveProduct ? 'Update' : 'Upload'}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
