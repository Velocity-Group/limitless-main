/* eslint-disable prefer-promise-reject-errors */
import { PureComponent, createRef } from 'react';
import {
  Form, Input, Button, Select, Switch, InputNumber, Popover
} from 'antd';
import { IMenu } from 'src/interfaces';
import { FormInstance } from 'antd/lib/form';
import { SelectPostDropdown } from '@components/post/select-post-dropdown';
import { isUrl } from '@lib/string';
import Link from 'next/link';
import { QuestionCircleOutlined } from '@ant-design/icons';

interface IProps {
  menu?: IMenu;
  onFinish: Function;
  submiting?: boolean;
}
export class FormMenu extends PureComponent<IProps> {
  formRef: any;

  state = {
    isInternal: false,
    path: ''
  };

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { menu } = this.props;
    if (menu) {
      this.setState({
        isInternal: menu.internal,
        path: menu.path
      });
    }
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { menu, onFinish, submiting } = this.props;
    const { isInternal, path } = this.state;
    return (
      <Form
        ref={this.formRef}
        onFinish={onFinish.bind(this)}
        initialValues={
          menu
          || ({
            title: '',
            path: '',
            help: '',
            public: false,
            internal: false,
            parentId: null,
            section: 'footer',
            ordering: 0,
            isPage: false,
            isNewTab: false
          })
        }
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
      >
        <Form.Item
          name="internal"
          label={(
            <>
              <Popover content={<p>Using website post as menu item or an external link</p>}>
                <a style={{ marginRight: '5px' }}>
                  <QuestionCircleOutlined />
                </a>
              </Popover>
              From sytem post?
            </>
          )}
          valuePropName="checked"
        >
          <Switch
            defaultChecked={false}
            onChange={(val) => {
              this.setState({ isInternal: val });
              if (!val) {
                this.setFormVal('path', '');
                this.setFormVal('isPage', false);
              }
            }}
          />
        </Form.Item>
        <Form.Item name="isNewTab" label="Is new tab?" valuePropName="checked">
          <Switch defaultChecked={false} />
        </Form.Item>
        <Form.Item name="title" rules={[{ required: true, message: 'Please input title of menu!' }]} label="Title">
          <Input placeholder="Enter menu title" />
        </Form.Item>
        {isInternal ? (
          <Form.Item
            name="path"
            label={(
              <>
                <Popover
                  content={(
                    <p>
                      If there is no data, please create a post
                      {' '}
                      <Link href="/posts/create">
                        <a>here</a>
                      </Link>
                    </p>
                  )}
                  title={null}
                >
                  <a style={{ marginRight: '5px' }}>
                    <QuestionCircleOutlined />
                  </a>
                </Popover>
                Posts
              </>
            )}
          >
            <SelectPostDropdown
              defaultValue={path && path.replace('/page/', '')}
              onSelect={(val) => {
                this.setFormVal('path', val ? `/page/${val}` : '');
              }}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="path"
            rules={[
              { required: true, message: 'Please input url of menu!' },
              {
                validator: (rule, value) => {
                  if (!value) return Promise.resolve();
                  const isUrlValid = isUrl(value);
                  if (isInternal && isUrlValid) {
                    return Promise.reject('The path is not valid');
                  }
                  if (!isInternal && !isUrlValid) {
                    return Promise.reject('The url is not valid');
                  }
                  return Promise.resolve();
                }
              }
            ]}
            label="Url"
          >
            <Input placeholder="Enter menu url" />
          </Form.Item>
        )}
        {/* <Form.Item name="help" label="Help">
          <Input placeholder="Help" />
        </Form.Item> */}
        <Form.Item name="section" label="Section" rules={[{ required: true, message: 'Please select menu section!' }]}>
          <Select disabled>
            {/* <Select.Option key="main" value="main">
              Main
            </Select.Option>
            <Select.Option key="header" value="header">
              Header
            </Select.Option> */}
            <Select.Option key="footer" value="footer">
              Footer
            </Select.Option>
          </Select>
        </Form.Item>
        {/* <Form.Item name="parentId" label="Parent">
          <SelectMenuTreeDropdown
            defaultValue={menu && menu.parentId}
            onSelect={(val) => this.setFormVal('parentId', val)}
            menu={menu || null}
          />
        </Form.Item>
        <Form.Item name="public" label="Public" valuePropName="checked">
          <Switch />
        </Form.Item> */}
        <Form.Item name="ordering" label="Ordering">
          <InputNumber type="number" placeholder="Enter ordering of menu item" />
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
