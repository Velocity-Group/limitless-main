/* eslint-disable react/require-default-props */
import { useState } from 'react';
import {
  Form, Input, Button, Select, Upload, Switch, InputNumber, Divider
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { IGallery } from 'src/interfaces';
import Router from 'next/router';
import PhotoUploadList from '@components/file/upload-list';
import './gallery.less';
import { useIntl } from 'react-intl';

interface IProps {
  gallery?: IGallery;
  onFinish: Function;
  submiting: boolean;
  filesList?: any[];
  handleBeforeUpload?: Function;
  removePhoto?: Function;
  setCover?: Function;
}

const { Dragger } = Upload;

const FormGallery = ({
  onFinish,
  submiting,
  filesList,
  handleBeforeUpload,
  removePhoto,
  setCover,
  gallery = null
}: IProps) => {
  const [form] = Form.useForm();
  const [isSale, setSale] = useState(gallery?.isSale || false);
  const intl = useIntl();

  return (
    <Form
      form={form}
      name="galleryForm"
      onFinish={onFinish.bind(this)}
      initialValues={
        gallery || {
          title: '', status: 'active', description: '', price: 4.99, isSale: false
        }
      }
      labelCol={{ span: 24 }}
      wrapperCol={{ span: 24 }}
      className="account-form"
      scrollToFirstError
    >
      <Form.Item
        name="title"
        rules={[{
          required: true,
          message: intl.formatMessage({
            id: 'pleaseInputGalleryTitle',
            defaultMessage: 'Please input gallery title!'
          })
        }]}
        label={intl.formatMessage({ id: 'title', defaultMessage: 'Title' })}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label={intl.formatMessage({ id: 'description', defaultMessage: 'Description' })}
      >
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item
        name="isSale"
        label={intl.formatMessage({ id: 'forSale', defaultMessage: 'For sale?' })}
      >
        <Switch
          checkedChildren={intl.formatMessage({
            id: 'payPerView',
            defaultMessage: 'Pay per view'
          })}
          unCheckedChildren={intl.formatMessage({
            id: 'subscribeToView',
            defaultMessage: 'Subscribe to view'
          })}
          checked={isSale}
          onChange={(val) => setSale(val)}
        />
      </Form.Item>
      {isSale && (
        <Form.Item
          name="price"
          rules={[{
            required: true,
            message: `${intl.formatMessage({
              id: 'pleaseInputThePrice',
              defaultMessage: 'Please input the price'
            })}`
          }]}
          label={intl.formatMessage({ id: 'price', defaultMessage: 'Price' })}
        >
          <InputNumber min={1} />
        </Form.Item>
      )}
      <Form.Item
        name="status"
        label={intl.formatMessage({ id: 'status', defaultMessage: 'Status' })}
        rules={[{
          required: true,
          message: intl.formatMessage({
            id: 'pleaseSelectStatus',
            defaultMessage: 'Please select status'
          })
        }]}
      >
        <Select>
          <Select.Option key="active" value="active">
            {intl.formatMessage({ id: 'active', defaultMessage: 'Active' })}
          </Select.Option>
          <Select.Option key="inactive" value="inactive">
            {intl.formatMessage({ id: 'inactive', defaultMessage: 'Inactive' })}
          </Select.Option>
        </Select>
      </Form.Item>
      {gallery && (
      <Divider>
        {intl.formatMessage({
          id: 'uploadPhotos',
          defaultMessage: 'Upload Photos'
        })}
      </Divider>
      )}
      {gallery && (
        <Dragger
          accept="image/*"
          multiple
          showUploadList={false}
          listType="picture"
          disabled={submiting}
          beforeUpload={handleBeforeUpload && handleBeforeUpload.bind(this)}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {intl.formatMessage({
              id: 'clickOrDragFilesToThisAreaToUpload',
              defaultMessage: 'Click or drag files to this area to upload'
            })}
          </p>
        </Dragger>
      )}
      {filesList && filesList.length > 0 && (
        <PhotoUploadList
          files={filesList}
          setCover={setCover && setCover.bind(this)}
          remove={removePhoto && removePhoto.bind(this)}
        />
      )}
      <Form.Item>
        <Button
          className="primary"
          htmlType="submit"
          loading={submiting}
          disabled={submiting}
          style={{ marginRight: '20px' }}
        >
          {intl.formatMessage({ id: 'submit', defaultMessage: 'Submit' })}
        </Button>
        <Button
          className="secondary"
          onClick={() => Router.push('/model/my-gallery')}
        >
          {intl.formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormGallery;
