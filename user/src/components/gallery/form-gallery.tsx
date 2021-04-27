/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-no-bind */
import React from 'react';
import {
  Form, Input, Button, Select
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { IGallery, IPhotos } from 'src/interfaces';
import Router from 'next/router';
import './gallery.less';

interface IProps {
  gallery?: IGallery;
  onFinish: Function;
  submitting: boolean;
  photosList?: IPhotos[];
  removePhoto?: Function;
}

const FormGallery = ({
  onFinish,
  submitting,
  gallery = null,
  photosList = [],
  removePhoto = () => {}
}: IProps) => {
  const [form] = Form.useForm();

  return (
    <>
      <Form
        form={form}
        name="galleryForm"
        onFinish={onFinish.bind(this)}
        initialValues={
          gallery || { name: '', status: 'active', description: '' }
        }
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        className="account-form"
      >
        <Form.Item
          name="name"
          rules={[{ required: true, message: 'Please input name of gallery!' }]}
          label="Name"
          labelCol={{ span: 24 }}
        >
          <Input placeholder="Enter gallery's name" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          labelCol={{ span: 24 }}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          name="status"
          label="Status"
          labelCol={{ span: 24 }}
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
        <Form.Item>
          <Button
            className="primary"
            htmlType="submit"
            loading={submitting}
            disabled={submitting}
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
                <DeleteOutlined onClick={removePhoto.bind(this, photo._id)} />
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default FormGallery;
