/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { PureComponent, createRef } from 'react';
import {
  Upload, message, Button, Tooltip, Select,
  Input, Form, InputNumber, Switch, Progress
} from 'antd';
import {
  FileAddOutlined, BarChartOutlined, PictureOutlined, VideoCameraAddOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import UploadList from '@components/file/list-media';
import { IFeed } from 'src/interfaces';
import { feedService } from '@services/index';
import './index.less';
import Router from 'next/router';
import moment from 'moment';
import { formatDate } from '@lib/date';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { FormInstance } from 'antd/lib/form';
import AddPollDurationForm from './add-poll-duration';

const { TextArea } = Input;
const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};
interface IProps {
  discard?: Function;
  feed?: IFeed;
  onDelete?: Function;
}
const validateMessages = {
  required: 'This field is required!'
};

export default class FormFeed extends PureComponent<IProps> {
  formRef: any;

  pollIds = [];

  thumbnailId = '';

  teaserId = '';

  teaser = null;

  state = {
    type: 'text',
    uploading: false,
    thumbnail: null,
    fileList: [],
    fileIds: [],
    pollList: [],
    isSale: false,
    addPoll: false,
    openPollDuration: false,
    expirePollTime: 7,
    expiredPollAt: moment().endOf('day').add(7, 'days')
  };

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { feed } = this.props;
    if (feed) {
      this.setState({
        type: feed.type,
        fileList: feed.files ? feed.files : [],
        fileIds: feed.fileIds ? feed.fileIds : [],
        isSale: feed.isSale,
        addPoll: !!feed.pollIds.length,
        pollList: feed.polls,
        thumbnail: feed.thumbnailUrl
      });
      this.teaser = feed.teaser;
    }
  }

  async onAddMore(file, listFile) {
    const { fileList, fileIds } = this.state;
    if (!listFile.length) {
      return;
    }
    if (listFile.indexOf(file) === (listFile.length - 1)) {
      const files = await Promise.all(listFile.map((f) => {
        const newFile = f;
        if (newFile.type.includes('video')) return f;
        const reader = new FileReader();
        reader.addEventListener('load', () => { newFile.thumbnail = reader.result; });
        reader.readAsDataURL(newFile);
        return newFile;
      }));
      await this.setState({
        fileList: [...fileList, ...files],
        uploading: true
      });
      const newFileIds = [...fileIds];
      for (const fileItem of listFile) {
        try {
          if (['uploading', 'done'].includes(fileItem.status) || fileItem._id) continue;
          fileItem.status = 'uploading';
          const resp = (fileItem.type.indexOf('image') > -1 ? await feedService.uploadPhoto(
            fileItem,
            {},
            this.onUploading.bind(this, fileItem)
          ) : await feedService.uploadVideo(
            fileItem,
            {},
            this.onUploading.bind(this, fileItem)
          )) as any;
          newFileIds.push(resp.data._id);
          fileItem._id = resp.data._id;
        } catch (e) {
          message.error(`File ${fileItem.name} error!`);
        } finally {
          await this.setState({ uploading: false, fileIds: newFileIds });
          this.forceUpdate();
        }
      }
    }
  }

  onUploading(file, resp: any) {
    file.percent = resp.percentage;
    if (file.percent === 100) file.status = 'done';
    this.forceUpdate();
  }

  async onAddPoll() {
    const { addPoll } = this.state;
    await this.setState({ addPoll: !addPoll });
    if (!addPoll) {
      this.pollIds = [];
      this.setState({ pollList: [] });
    }
  }

  async onChangePoll(index, e) {
    const { value } = e.target;
    await this.setState((prevState: any) => {
      const newItems = [...prevState.pollList];
      newItems[index] = value;
      return { pollList: newItems };
    });
  }

  async onsubmit(feed, values) {
    const { type } = this.state;
    try {
      !feed ? await feedService.create({ ...values, type }) : await feedService.update(feed._id, { ...values, type: feed.type });
      message.success(`${!feed ? 'Posted' : 'Updated'} successfully!`);
      Router.replace('/feed');
    } catch {
      message.success('Something went wrong, please try again later');
    } finally {
      this.setState({ uploading: false });
    }
  }

  async onChangePollDuration(numberDays) {
    const date = !numberDays ? moment().endOf('day').add(99, 'years') : moment().endOf('day').add(numberDays, 'days');
    this.setState({ openPollDuration: false, expiredPollAt: date, expirePollTime: numberDays });
  }

  async onClearPolls() {
    this.setState({ pollList: [] });
    this.pollIds = [];
  }

  async setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    await instance.setFieldsValue({
      [field]: val
    });
  }

  async remove(file) {
    const { fileList, fileIds } = this.state;
    fileList.splice(fileList.findIndex((f) => (f._id ? f._id === file._id : f.uid === file.uid)), 1);
    file._id && fileIds.splice(fileIds.findIndex((id) => id === file._id), 1);
    await this.setState({ fileList, fileIds });
    this.forceUpdate();
  }

  async beforeUpload(file, fileList) {
    const { fileIds } = this.state;
    if (!fileList.length) {
      return this.setState({ fileList: [] });
    }
    if (fileList.indexOf(file) === (fileList.length - 1)) {
      const files = await Promise.all(fileList.map((f) => {
        if (f._id || f.type.includes('video')) return f;
        const reader = new FileReader();
        reader.addEventListener('load', () => { f.thumbnail = reader.result; });
        reader.readAsDataURL(f);
        return f;
      }));
      await this.setState({ fileList: files, uploading: true });
      const newFileIds = [...fileIds];
      for (const newFile of fileList) {
        try {
          if (['uploading', 'done'].includes(newFile.status) || newFile._id) continue;
          newFile.status = 'uploading';
          const resp = (newFile.type.indexOf('image') > -1 ? await feedService.uploadPhoto(
            newFile,
            {},
            this.onUploading.bind(this, newFile)
          ) : await feedService.uploadVideo(
            newFile,
            {},
            this.onUploading.bind(this, newFile)
          )) as any;
          newFileIds.push(resp.data._id);
          newFile._id = resp.data._id;
        } catch (e) {
          message.error(`File ${newFile.name} error!`);
        } finally {
          await this.setState({ uploading: false, fileIds: newFileIds });
          this.forceUpdate();
        }
      }
      return false;
    }
    return false;
  }

  async beforeUploadThumbnail(file) {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => { this.setState({ thumbnail: reader.result }); });
    reader.readAsDataURL(file);
    try {
      const resp = await feedService.uploadThumbnail(
        file,
        {},
        this.onUploading.bind(this, file)
      ) as any;
      this.thumbnailId = resp.data._id;
    } catch (e) {
      message.error(`Thumbnail file ${file.name} error!`);
    } finally {
      this.setState({ uploading: false });
    }
  }

  async beforeUploadteaser(file) {
    if (!file) {
      return;
    }
    this.teaser = file;
    const isLt2M = file.size / 1024 / 1024 < 100;
    if (!isLt2M) {
      message.error('Teaser must be smaller than 100MB!');
    }
    try {
      const resp = await feedService.uploadTeaser(
        file,
        {},
        this.onUploading.bind(this, this.teaser)
      ) as any;
      this.teaserId = resp.data._id;
    } catch (e) {
      message.error(`teaser file ${file.name} error!`);
    } finally {
      this.setState({ uploading: false });
    }
  }

  async submit(formValues: any) {
    const { feed } = this.props;
    const {
      pollList, addPoll, isSale, expiredPollAt, fileIds, type
    } = this.state;
    if (!formValues.text.trim()) {
      return message.error('Please add a description');
    }
    if (formValues.price < 1) {
      return message.error('Price must be greater than $1');
    }
    if (this.teaserId) {
      formValues.teaserId = this.teaserId;
    }
    if (this.thumbnailId) {
      formValues.thumbnailId = this.thumbnailId;
    }
    formValues.isSale = isSale;
    if (['video', 'photo'].includes(feed?.type || type) && !fileIds.length) {
      return message.error(`Please add ${feed?.type || type} file`);
    }

    // create polls
    let i = 0;
    if (addPoll && pollList.length < 2) {
      return message.error('Polls must have at least 2 options');
    } if (addPoll && pollList.length >= 2) {
      await this.setState({ uploading: true });
      for (const poll of pollList) {
        try {
          if (!poll.length) continue;
          const resp = await feedService.addPoll({
            description: poll,
            expiredAt: expiredPollAt
          });
          if (resp && resp.data) {
            this.pollIds = [...this.pollIds, resp.data._id];
          }
        } catch (e) {
          console.log('err_create_poll', await e);
        } finally {
          i += 1;
          if (i === pollList.length) {
            formValues.pollIds = this.pollIds;
            formValues.pollExpiredAt = expiredPollAt;
            this.onsubmit(feed, formValues);
          }
        }
      }
    } else {
      await this.setState({ uploading: true });
      this.onsubmit(feed, formValues);
    }
    return undefined;
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { feed, onDelete } = this.props;
    const {
      uploading, fileList, fileIds, isSale, pollList, type,
      addPoll, openPollDuration, expirePollTime, thumbnail
    } = this.state;
    return (
      <div className="feed-form">
        <Form
          {...layout}
          ref={this.formRef}
          onFinish={(values) => {
            values.fileIds = fileIds;
            values.type = 'feed';
            this.submit(values);
          }}
          validateMessages={validateMessages}
          initialValues={feed || ({
            type: 'text',
            text: '',
            price: 4.99,
            isSale: false
          } as IFeed)}
        >
          <Form.Item
            name="fromSourceId"
            label="Select model"
            rules={[
              { required: true, message: 'Please select a model!' }]}
          >
            <SelectPerformerDropdown
              defaultValue={feed && (feed?.fromSourceId || '')}
              onSelect={(val) => this.setFormVal('fromSourceId', val)}
            />
          </Form.Item>
          <Form.Item name="type" label="Select post type" rules={[{ required: true }]}>
            <Select value={type} onChange={(val) => this.setState({ type: val })}>
              <Select.Option value="text">Text</Select.Option>
              <Select.Option value="video">Video</Select.Option>
              <Select.Option value="photo">Photos</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Add description" name="text" rules={[{ required: true, message: 'Please add a description' }]}>
            <TextArea className="feed-input" rows={3} placeholder="Add a description" allowClear />
          </Form.Item>
          <Form.Item>
            <Switch checkedChildren="PPV Content" unCheckedChildren="Free Content" checked={isSale} onChange={() => this.setState({ isSale: !isSale })} />
          </Form.Item>
          {['photo', 'video'].includes(type) && (
          <Form.Item label={type === 'video' ? 'Video file' : 'Photo files'}>
            {fileList.length ? (
              <UploadList
                canAddMore={feed?.type === 'photo' || type === 'photo'}
                type={feed?.type || type}
                files={fileList}
                remove={this.remove.bind(this)}
                onAddMore={this.onAddMore.bind(this)}
                uploading={uploading}
              />
            ) : (
              <p>
                Please upload
                {' '}
                {type === 'video' ? 'video file' : 'photo files'}
              </p>
            )}
          </Form.Item>
          )}
          {isSale && (
            <Form.Item label="Set price here" name="price" rules={[{ required: isSale, message: 'Please add price' }]}>
              <InputNumber min={1} />
            </Form.Item>
          )}
          {thumbnail && (
            <Form.Item label="Thumbnail">
              <a href={thumbnail} target="_blank" rel="noreferrer">
                <img alt="thumbnail" src={thumbnail} width="100px" />
              </a>
            </Form.Item>
          )}
          {this.teaser && (
            <Form.Item label="Teaser">
              <div className="f-upload-list">
                <div className="f-upload-item">
                  <div className="f-upload-thumb">
                    <a href={this.teaser?.url} target="_blank" rel="noreferrer">
                      <span className="f-thumb-vid">
                        <PlayCircleOutlined />
                      </span>
                    </a>
                  </div>
                  <div className="f-upload-name">
                    <Tooltip title={this.teaser?.name}>{this.teaser?.name}</Tooltip>
                  </div>
                  <div className="f-upload-size">
                    {(this.teaser.size / (1024 * 1024)).toFixed(2)}
                    {' '}
                    MB
                  </div>
                  {this.teaser.percent && <Progress percent={Math.round(this.teaser.percent)} />}
                </div>
              </div>
            </Form.Item>
          )}
          {addPoll
            && (
              <Form.Item label="Add Polls">
                <div className="poll-form">
                  <div className="poll-top">
                    {!feed ? (
                      <>
                        <span aria-hidden="true" onClick={() => this.setState({ openPollDuration: true })}>
                          Poll duration -
                          {' '}
                          {!expirePollTime ? 'No limit' : `${expirePollTime} days`}
                        </span>
                        <a aria-hidden="true" onClick={this.onAddPoll.bind(this)}>x</a>
                      </>
                    )
                      : (
                        <span>
                          Poll expiration
                          {' '}
                          {formatDate(feed?.pollExpiredAt)}
                        </span>
                      )}
                  </div>
                  <Input disabled={!!feed?._id} className="poll-input" value={pollList && pollList.length > 0 && pollList[0]._id ? pollList[0].description : pollList[0] ? pollList[0] : ''} onChange={this.onChangePoll.bind(this, 0)} />
                  <Input disabled={!!feed?._id || !pollList.length} className="poll-input" value={pollList && pollList.length > 1 && pollList[1]._id ? pollList[1].description : pollList[1] ? pollList[1] : ''} onChange={this.onChangePoll.bind(this, 1)} />

                  {pollList.map((poll, index) => {
                    if (index === 0 || index === 1) return null;
                    return <Input disabled={!!feed?._id} key={`poll_${index}`} value={(poll._id ? poll.description : poll) || ''} className="poll-input" onChange={this.onChangePoll.bind(this, index)} />;
                  })}
                  {!feed && pollList.length > 1 && (
                  <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <a aria-hidden onClick={() => this.setState({ pollList: pollList.concat(['']) })}>Add another option</a>
                    <a aria-hidden onClick={this.onClearPolls.bind(this)}>
                      Clear polls
                    </a>
                  </p>
                  )}
                </div>
              </Form.Item>
            )}
          <div style={{ display: 'flex' }}>
            {['video', 'photo'].includes(feed?.type || type) && [
              <Upload
                key="upload_media_file"
                customRequest={() => true}
                accept={(feed?.type === 'video' || type === 'video') ? 'video/*' : 'image/*'}
                beforeUpload={this.beforeUpload.bind(this)}
                multiple={feed?.type === 'photo' || type === 'photo'}
                showUploadList={false}
                disabled={uploading}
                listType="picture"
              >
                <Tooltip title="Click to upload files"><Button type="primary"><FileAddOutlined /></Button></Tooltip>
              </Upload>,
              <Upload
                key="upload_thumb"
                customRequest={() => true}
                accept={'image/*'}
                beforeUpload={this.beforeUploadThumbnail.bind(this)}
                multiple={false}
                showUploadList={false}
                disabled={uploading}
                listType="picture"
              >
                <Tooltip title="Click to upload thumbnail"><Button type="primary" style={{ marginLeft: 15 }}><PictureOutlined /></Button></Tooltip>
              </Upload>
            ]}
            {['video'].includes(feed?.type || type) && [
              <Upload
                key="upload_teaser"
                customRequest={() => true}
                accept={'video/*'}
                beforeUpload={this.beforeUploadteaser.bind(this)}
                multiple={false}
                showUploadList={false}
                disabled={uploading}
                listType="picture"
              >
                <Tooltip title="Click to upload teaser video (<100MB)"><Button type="primary" style={{ marginLeft: 15 }}><VideoCameraAddOutlined /></Button></Tooltip>
              </Upload>
            ]}
            <Tooltip title="Click to add polls"><Button disabled={addPoll || (!!(feed && feed._id))} type="primary" style={{ marginLeft: '15px' }} onClick={this.onAddPoll.bind(this)}><BarChartOutlined style={{ transform: 'rotate(90deg)' }} /></Button></Tooltip>
          </div>
          <AddPollDurationForm onAddPollDuration={this.onChangePollDuration.bind(this)} openDurationPollModal={openPollDuration} />
          <div className="submit-btns">
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginRight: '20px' }}
              loading={uploading}
              disabled={uploading}
            >
              {!feed ? 'Post' : 'Update'}
            </Button>
            {feed && (
            <Button
              style={{ marginRight: '20px' }}
              loading={uploading}
              disabled={uploading}
              onClick={() => onDelete(feed._id)}
            >
              Delete
            </Button>
            )}
            <Button
              onClick={() => Router.back()}
              loading={uploading}
              disabled={uploading}
            >
              Back
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}
