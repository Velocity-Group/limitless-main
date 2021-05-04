import {
  Form, Input, Button, Select, InputNumber, Switch
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { IGallery, IPhotos } from 'src/interfaces';
import Router from 'next/router';
import './gallery.less';
import { useState } from 'react';

interface IProps {
  gallery: IGallery;
  onFinish: Function;
  submiting: boolean;
  photosList: IPhotos[];
  removePhoto: Function;
}

const FormGallery = ({
  onFinish,
  submiting,
  gallery,
  photosList = [],
  removePhoto
}: IProps) => {
  const [form] = Form.useForm();

  const [isSale, setSale] = useState(gallery?.isSale || false);

  return (
    <>
      <Form
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
        form={form}
        name="galleryForm"
        onFinish={onFinish.bind(this)}
        initialValues={
          gallery || {
            title: '', status: 'active', description: '', isSale: false, price: false
          }
        }
        className="account-form"
      >
        <Form.Item
          name="title"
          rules={[{ required: true, message: 'Please input gallery title!' }]}
          label="Title"
        >
          <Input placeholder="Enter gallery title" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea placeholder="Enter description here" rows={3} />
        </Form.Item>
        <Form.Item
          name="isSale"
          label="For sale?"
        >
          <Switch checkedChildren="Sale" unCheckedChildren="Free" checked={isSale} onChange={(val) => setSale(val)} />
        </Form.Item>
        {isSale && (
        <Form.Item
          name="price"
          rules={[{ required: true, message: 'Please input amount of tokens' }]}
          label="Amount of Tokens"
        >
          <InputNumber min={1} />
        </Form.Item>
        )}
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
        <div style={{ margin: 5 }} />
        <Form.Item>
          <Button
            className="primary"
            htmlType="submit"
            loading={submiting}
            disabled={submiting}
            style={{ marginRight: '20px' }}
          >
            Submit
          </Button>
          <Button
            className="secondary"
            onClick={() => Router.push('/model/my-gallery/listing')}
          >
            Cancel
          </Button>
        </Form.Item>
      </Form>
      <div className="grid-photos">
        {photosList
          && photosList.length > 0
          && photosList.map((photo) => (
            <div className="grid-item" key={photo._id}>
              <img
                alt={photo.title}
                src={photo.photo.url || photo.photo.thumbnails[0]}
              />
              <div className="remove-section">
                <DeleteOutlined onClick={() => removePhoto(photo._id)} />
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default FormGallery;
