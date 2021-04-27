/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { PureComponent } from 'react';
import dynamic from 'next/dynamic';
import {
  Upload, message, Button, Input, Form
} from 'antd';
import { } from '@ant-design/icons';
import { IBlog } from 'src/interfaces';
import { blogService } from '@services/index';
import './index.less';
import Router from 'next/router';

import UploadList from '@components/file/list-media';

const WYSIWYG = dynamic(() => import('@components/wysiwyg'), {
  ssr: false
});

interface IProps {
  blog?: IBlog;
}
const validateMessages = {
  required: 'This field is required!'
};

export default class BlogForm extends PureComponent<IProps> {
  private _content: string = '';

  state = {
    uploading: false,
    fileList: [],
    fileIds: []
  };

  componentDidMount() {
    const { blog } = this.props;
    if (blog) {
      this._content = blog.text;
      this.setStateAsync({
        fileList: blog.files ? blog.files : [],
        fileIds: blog.fileIds ? blog.fileIds : []
      });
    }
  }

  onUploading(file, resp: any) {
    file.percent = resp.percentage;
    if (file.percent === 100) file.status = 'done';
    this.forceUpdate();
  }

  async onsubmit(blog, values) {
    try {
      !blog
        ? await blogService.create(values)
        : await blogService.update(blog._id, values);
      message.success('Posted successfully!');
      Router.back();
    } catch {
      message.success('Something went wrong, please try again later');
    } finally {
      await this.setStateAsync({ uploading: false });
    }
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve);
    });
  }

  async remove(file) {
    const { fileList, fileIds } = this.state;
    fileList.splice(
      fileList.findIndex((f) => (f._id ? f._id === file._id : f.uid === file.uid)),
      1
    );
    file._id
      && fileIds.splice(
        fileIds.findIndex((id) => id === file._id),
        1
      );
    this.setStateAsync({ fileList, fileIds });
    this.forceUpdate();
  }

  async beforeUpload(file, fileList) {
    const { fileIds } = this.state;
    if (!fileList.length) {
      return this.setStateAsync({ fileList: [] });
    }
    if (fileList.indexOf(file) === fileList.length - 1) {
      const files = await Promise.all(fileList.map((f) => {
        const newFile = f;
        const reader = new FileReader();
        reader.addEventListener('load', () => { newFile.thumbnail = reader.result; });
        reader.readAsDataURL(newFile);
        return newFile;
      }));
      await this.setStateAsync({ fileList: files, uploading: true });
      const newFileIds = [...fileIds];
      for (const newFile of fileList) {
        try {
          if (['uploading', 'done'].includes(newFile.status) || newFile._id) { continue; }
          newFile.status = 'uploading';
          const resp = (newFile.type.indexOf('image') > -1
            ? await blogService.uploadPhoto(
              newFile,
              {},
              this.onUploading.bind(this, newFile)
            )
            : await blogService.uploadVideo(
              newFile,
              {},
              this.onUploading.bind(this, newFile)
            )) as any;
          newFileIds.push(resp.data._id);
          newFile._id = resp.data._id;
        } catch (e) {
          message.error(`File ${newFile.name} error!`);
        } finally {
          this.forceUpdate();
          await this.setStateAsync({ uploading: false, fileIds: newFileIds });
        }
      }
      return false;
    }
    return false;
  }

  contentChange(content: { [html: string]: string }) {
    this._content = content.html;
  }

  async submit(formValues: any) {
    const { blog } = this.props;
    if (!formValues.text.trim()) {
      return message.error('Please add a description');
    }

    // create polls
    await this.setStateAsync({ uploading: true });
    this.onsubmit(blog, formValues);
    return undefined;
  }

  render() {
    const { blog } = this.props;
    const { uploading, fileIds, fileList } = this.state;
    return (
      <div className="blog-form">
        <Form
          onFinish={(values) => {
            values.fileIds = fileIds;
            values.text = this._content;
            this.submit(values);
          }}
          validateMessages={validateMessages}
          initialValues={blog || ({ title: '', text: '' } as IBlog)}
        >
          <div>
            <Form.Item
              name="title"
              rules={[{ required: true, message: 'Please add a title' }]}
            >
              <Input
                className="blog-input"
                placeholder="Add a title"
                allowClear
              />
            </Form.Item>
            <Form.Item>
              <WYSIWYG onChange={this.contentChange.bind(this)} html={this._content} />
            </Form.Item>
            <div>
              <Upload
                customRequest={() => true}
                accept="image/*"
                beforeUpload={this.beforeUpload.bind(this)}
                multiple={false}
                showUploadList={false}
                disabled={uploading}
                listType="picture"
              >
                <Button type="primary">
                  Upload background Image
                </Button>
              </Upload>
              <UploadList
                files={fileList}
                remove={this.remove.bind(this)}
                onAddMore={null}
                uploading={uploading}
                canAddMore={false}
              />
            </div>

          </div>
          <div className="text-center">
            <Button
              className="secondary"
              htmlType="submit"
              loading={uploading}
              disabled={uploading}
            >
              Submit
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}
