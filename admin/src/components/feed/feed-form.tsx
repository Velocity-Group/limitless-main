/* eslint-disable no-await-in-loop */
import { PureComponent, createRef } from 'react';
import {
  Upload, message, Button, Tooltip, Select,
  Input, Form, InputNumber, Switch, Progress
} from 'antd';
import {
  BarChartOutlined, PictureOutlined, VideoCameraAddOutlined,
  PlayCircleOutlined, DeleteOutlined
} from '@ant-design/icons';
import UploadList from '@components/file/list-media';
import { IFeed } from 'src/interfaces';
import { feedService } from '@services/index';
import { getGlobalConfig } from '@services/config';
import Router from 'next/router';
import moment from 'moment';
import { formatDate } from '@lib/date';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { FormInstance } from 'antd/lib/form';
import AddPollDurationForm from './add-poll-duration';
import './index.less';

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

  thumbnailId = null;

  teaserId = null;

  state = {
    type: 'text',
    uploading: false,
    thumbnail: null,
    teaser: null,
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
        thumbnail: feed.thumbnail,
        teaser: feed.teaser
      });

      this.teaserId = feed.teaserId;
      this.thumbnailId = feed.thumbnailId;
    }
  }

  handleDeleteFile(field: string) {
    if (field === 'thumbnail') {
      this.setState({ thumbnail: null });
      this.thumbnailId = null;
    }
    if (field === 'teaser') {
      this.setState({ teaser: null });
      this.teaserId = null;
    }
  }

  onUploading(file, resp: any) {
    // eslint-disable-next-line no-param-reassign
    file.percent = resp.percentage;
    // eslint-disable-next-line no-param-reassign
    if (file.percent === 100) file.status = 'done';
    this.forceUpdate();
  }

  async onAddPoll() {
    const { addPoll } = this.state;
    this.setState({ addPoll: !addPoll });
    if (!addPoll) {
      this.pollIds = [];
      this.setState({ pollList: [] });
    }
  }

  async onChangePoll(index, e) {
    const { value } = e.target;
    this.setState((prevState: any) => {
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
    this.setState({
      fileList: fileList.filter((f) => (f._id ? f._id !== file._id : f.uid !== file.uid)),
      fileIds: fileIds.filter((id) => id !== file?._id)
    });
  }

  async beforeUpload(file, listFile) {
    const config = getGlobalConfig();
    const { fileList, fileIds } = this.state;
    if (file.type.includes('image')) {
      const valid = (file.size / 1024 / 1024) < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5);
      if (!valid) {
        message.error(`Image ${file.name} must be smaller than ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB!`);
        return false;
      }
    }
    if (file.type.includes('video')) {
      const valid = (file.size / 1024 / 1024) < (config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200);
      if (!valid) {
        message.error(`Video ${file.name} must be smaller than ${config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200}MB!`);
        return false;
      }
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
        fileList: file.type.includes('video') ? files : [...fileList, ...files],
        uploading: true
      });
      const newFileIds = file.type.includes('video') ? [] : [...fileIds];
      // eslint-disable-next-line no-restricted-syntax
      for (const fileItem of listFile) {
        try {
          // eslint-disable-next-line no-continue
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
        }
      }
      this.setState({ uploading: false, fileIds: newFileIds });
    }
    return true;
  }

  async beforeUploadThumbnail(file) {
    if (!file) {
      return;
    }
    const config = getGlobalConfig();
    const valid = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5);
    if (!valid) {
      message.error(`Thumbnail must be smaller than ${config.NEXT_PUBLIC_MAX_SIZE_IMAGE || 5}MB`);
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
    const config = getGlobalConfig();
    const valid = file.size / 1024 / 1024 < (config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200);
    if (!valid) {
      message.error(`Teaser must be smaller than ${config.NEXT_PUBLIC_MAX_SIZE_TEASER || 200}MB`);
      return;
    }
    this.setState({ teaser: file });
    try {
      const resp = await feedService.uploadTeaser(
        file,
        {},
        this.onUploading.bind(this, file)
      ) as any;
      this.teaserId = resp.data._id;
    } catch (e) {
      message.error(`teaser file ${file.name} error!`);
    } finally {
      this.setState({ uploading: false });
    }
  }

  async submit(payload: any) {
    const { feed } = this.props;
    const {
      pollList, addPoll, isSale, expiredPollAt, fileIds, type
    } = this.state;
    const formValues = payload;
    if (!formValues.text || !formValues.text.trim()) {
      return message.error('Please add a description');
    }
    if (formValues.price < 1) {
      return message.error('Tokens must be greater than 1');
    }
    formValues.teaserId = this.teaserId;
    formValues.thumbnailId = this.thumbnailId;
    formValues.isSale = isSale;
    formValues.fileIds = fileIds;
    if (['video', 'photo'].includes(feed?.type || type) && !fileIds.length) {
      return message.error(`Please add ${feed?.type || type} file`);
    }
    await this.setState({ uploading: true });
    if (addPoll && pollList.length < 2) {
      return message.error('Polls must have at least 2 options');
    } if (addPoll && pollList.length >= 2) {
      // eslint-disable-next-line no-restricted-syntax
      for (const poll of pollList) {
        try {
          // eslint-disable-next-line no-continue
          if (!poll.length || poll._id) continue;
          const resp = await feedService.addPoll({
            description: poll,
            expiredAt: expiredPollAt
          });
          if (resp && resp.data) {
            this.pollIds = [...this.pollIds, resp.data._id];
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('err_create_poll', await e);
        }
      }
      formValues.pollIds = this.pollIds;
      formValues.pollExpiredAt = expiredPollAt;
      this.onsubmit(feed, formValues);
    } else {
      this.onsubmit(feed, formValues);
    }
    return false;
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { feed, onDelete } = this.props;
    const {
      uploading, fileList, isSale, pollList, type, teaser,
      addPoll, openPollDuration, expirePollTime, thumbnail
    } = this.state;
    return (
      <div className="feed-form">
        <Form
          {...layout}
          ref={this.formRef}
          onFinish={(values) => {
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
              showAll
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
          {['photo', 'video'].includes(type) && (
          <Form.Item>
            <Switch checkedChildren="Pay per view" unCheckedChildren="Subscribe to view" checked={isSale} onChange={() => this.setState({ isSale: !isSale })} />
          </Form.Item>
          )}
          {isSale && (
            <Form.Item label="Amount of tokens" name="price" rules={[{ required: isSale, message: 'Please add amount of tokens' }]}>
              <InputNumber min={1} />
            </Form.Item>
          )}
          {thumbnail && (
          <Form.Item label="Thumbnail">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Button type="primary" onClick={() => this.handleDeleteFile('thumbnail')} style={{ position: 'absolute', top: 2, right: 2 }}><DeleteOutlined /></Button>
              <img alt="thumbnail" src={(thumbnail?.thumbnails && thumbnail?.thumbnails[0]) || thumbnail?.url || thumbnail} width="200px" />
            </div>
          </Form.Item>
          )}
          {teaser && (
            <Form.Item label="Teaser">
              <div className="f-upload-list">
                <div className="f-upload-item">
                  <div className="f-upload-thumb">
                    <a href={teaser?.url} target="_blank" rel="noreferrer">
                      <span className="f-thumb-vid">
                        <PlayCircleOutlined />
                      </span>
                    </a>
                  </div>
                  <div className="f-upload-name">
                    <Tooltip title={teaser?.name}>{teaser?.name}</Tooltip>
                  </div>
                  <div className="f-upload-size">
                    {(teaser.size / (1024 * 1024)).toFixed(2)}
                    {' '}
                    MB
                  </div>
                  <span className="f-remove">
                    <Button type="primary" onClick={() => this.handleDeleteFile('teaser')}>
                      <DeleteOutlined />
                    </Button>
                  </span>
                  {teaser.percent && <Progress percent={Math.round(teaser.percent)} />}
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
                  <Form.Item
                    name="pollDescription"
                    className="form-item-no-pad"
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      { required: true, message: 'Please add a question' }
                    ]}
                  >
                    <Input placeholder="Question" />
                  </Form.Item>
                  {/* eslint-disable-next-line no-nested-ternary */}
                  <Input disabled={!!feed?._id} className="poll-input" placeholder="Poll 1" value={pollList && pollList.length > 0 && pollList[0]._id ? pollList[0].description : pollList[0] ? pollList[0] : ''} onChange={this.onChangePoll.bind(this, 0)} />
                  {/* eslint-disable-next-line no-nested-ternary */}
                  <Input disabled={!!feed?._id || !pollList.length} className="poll-input" placeholder="Poll 2" value={pollList && pollList.length > 1 && pollList[1]._id ? pollList[1].description : pollList[1] ? pollList[1] : ''} onChange={this.onChangePoll.bind(this, 1)} />

                  {pollList.map((poll, index) => {
                    if (index === 0 || index === 1) return null;
                    // eslint-disable-next-line react/no-array-index-key
                    return <Input disabled={!!feed?._id} key={`poll_${index}`} placeholder={`Poll ${index + 1}`} value={(poll._id ? poll.description : poll) || ''} className="poll-input" onChange={this.onChangePoll.bind(this, index)} />;
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
          {['photo', 'video'].includes(type) && (
          <Form.Item label={type === 'video' ? 'Video file' : 'Photo files'}>
            <UploadList
              type={feed?.type || type}
              files={fileList}
              remove={this.remove.bind(this)}
              onAddMore={this.beforeUpload.bind(this)}
              uploading={uploading}
            />
          </Form.Item>
          )}
          <div style={{ display: 'flex', margin: '15px 0' }}>
            {['video', 'photo'].includes(feed?.type || type) && [
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
                <Button type="primary" style={{ marginLeft: 15 }}>
                  <PictureOutlined />
                  {' '}
                  Add Thumbnail
                </Button>
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
                <Button type="primary" style={{ marginLeft: 15 }}>
                  <VideoCameraAddOutlined />
                  {' '}
                  Add Teaser
                </Button>
              </Upload>
            ]}
            <Button disabled={addPoll || (!!(feed && feed._id))} type="primary" style={{ marginLeft: '15px' }} onClick={this.onAddPoll.bind(this)}>
              <BarChartOutlined style={{ transform: 'rotate(90deg)' }} />
              {' '}
              Add Polls
            </Button>
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
              {!feed ? 'POST' : 'UPDATE'}
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
