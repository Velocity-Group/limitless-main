/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { PureComponent } from 'react';
import {
  Upload, message, Button, Tooltip,
  Input, Form, InputNumber, Switch, Progress
} from 'antd';
import {
  FileAddOutlined, BarChartOutlined, PictureOutlined, VideoCameraAddOutlined,
  PlayCircleOutlined, SmileOutlined
} from '@ant-design/icons';
import UploadList from '@components/file/list-media';
import { IFeed } from 'src/interfaces';
import { feedService } from '@services/index';
import Router from 'next/router';
import moment from 'moment';
import { formatDate } from '@lib/date';
import { Emotions } from '@components/messages/emotions';
import AddPollDurationForm from './add-poll-duration';
import './index.less';

const { TextArea } = Input;
const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};
interface IProps {
  type?: string;
  discard?: Function;
  feed?: IFeed
}
const validateMessages = {
  required: 'This field is required!'
};

export default class FeedForm extends PureComponent<IProps> {
  pollIds = [];

  thumbnailId = '';

  teaserId = '';

  teaser = null;

  state = {
    uploading: false,
    thumbnail: null,
    fileList: [],
    fileIds: [],
    pollList: [],
    isSale: false,
    addPoll: false,
    openPollDuration: false,
    expirePollTime: 7,
    expiredPollAt: moment().endOf('day').add(7, 'days'),
    text: ''
  };

  componentDidMount() {
    const { feed } = this.props;
    if (feed) {
      this.setState({
        fileList: feed.files ? feed.files : [],
        fileIds: feed.fileIds ? feed.fileIds : [],
        isSale: feed.isSale,
        addPoll: !!feed.pollIds.length,
        pollList: feed.polls,
        thumbnail: feed.thumbnailUrl,
        text: feed.text
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
          if (['uploading', 'done'].includes(fileItem.status) || fileItem._id) return;
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
          this.setState({ uploading: false, fileIds: newFileIds });
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
    const { type } = this.props;
    try {
      !feed ? await feedService.create({ ...values, type }) : await feedService.update(feed._id, { ...values, type: feed.type });
      message.success('Posted successfully!');
      Router.back();
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

  onEmojiClick = (e, emojiObject) => {
    const { text } = this.state;
    this.setState({ text: `${text} ${emojiObject.emoji}` });
  }

  async remove(file) {
    const { fileList, fileIds } = this.state;
    fileList.splice(fileList.findIndex((f) => (f._id ? f._id === file._id : f.uid === file.uid)), 1);
    file._id && fileIds.splice(fileIds.findIndex((id) => id === file._id), 1);
    await this.setState({ fileList, fileIds });
    this.forceUpdate();
  }

  async beforeUpload(file, fileList) {
    await this.setState({ fileList: [] });
    if (fileList.indexOf(file) === (fileList.length - 1)) {
      const files = await Promise.all(fileList.map((f) => {
        if (f._id || f.type.includes('video')) return f;
        const reader = new FileReader();
        reader.addEventListener('load', () => { f.thumbnail = reader.result; });
        reader.readAsDataURL(f);
        return f;
      }));
      await this.setState({ fileList: files, uploading: true });
      const newFileIds = [];
      for (const newFile of fileList) {
        try {
          if (['uploading', 'done'].includes(newFile.status) || newFile._id) return;
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
    }
  }

  async beforeUploadThumbnail(file) {
    if (!file) {
      return;
    }
    const isLt2M = file.size / 1024 / 1024 <= 5;
    if (!isLt2M) {
      message.error('Image is too large please provide an image 5MB or below');
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
      message.error('Teaser video is too large please provide an video 100MB or below');
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
    const { feed, type } = this.props;
    const {
      pollList, addPoll, isSale, expiredPollAt, fileIds, text
    } = this.state;
    if (!text.trim()) {
      message.error('Please add a description');
      return;
    }
    if (formValues.price < 1) {
      message.error('Price must be greater than $1');
      return;
    }
    if (this.teaserId) {
      formValues.teaserId = this.teaserId;
    }
    if (this.thumbnailId) {
      formValues.thumbnailId = this.thumbnailId;
    }
    formValues.isSale = isSale;
    formValues.text = text;
    if (['video', 'photo'].includes(feed?.type || type) && !fileIds.length) {
      message.error(`Please add ${feed?.type || type} file`);
      return;
    }

    // create polls
    let i = 0;
    if (addPoll && pollList.length < 2) {
      message.error('Polls must have at least 2 options');
      return;
    } if (addPoll && pollList.length >= 2) {
      await this.setState({ uploading: true });
      for (const poll of pollList) {
        try {
          if (!poll.length) return;
          const resp = await feedService.addPoll({
            description: poll,
            expiredAt: expiredPollAt
          });
          if (resp && resp.data) {
            this.pollIds = [...this.pollIds, ...[resp.data._id]];
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
  }

  render() {
    const { feed, type, discard } = this.props;
    const {
      uploading, fileList, fileIds, isSale, pollList, text,
      addPoll, openPollDuration, expirePollTime, thumbnail
    } = this.state;
    return (
      <div className="feed-form">
        <Form
          {...layout}
          onFinish={(values) => {
            values.fileIds = fileIds;
            values.type = 'feed';
            this.submit(values);
          }}
          validateMessages={validateMessages}
          initialValues={feed || ({
            text: '',
            price: 4.99,
            isSale: false
          } as IFeed)}
        >
          <Form.Item rules={[{ required: true, message: 'Please add a description' }]}>
            <div className="input-f-desc">
              <TextArea value={text} onChange={(e) => this.setState({ text: e.target.value })} className="feed-input" rows={3} placeholder={!fileIds.length ? 'Compose new post...' : 'Add a description'} allowClear />
              <span className="grp-emotions">
                <SmileOutlined />
                <Emotions onEmojiClick={this.onEmojiClick.bind(this)} />
              </span>
            </div>
          </Form.Item>
          {/* {['video', 'photo'].includes(feed?.type || type) && (
            <Form.Item name="tagline">
              <Input className="feed-input" placeholder="Add a tagline here" />
            </Form.Item>
          )} */}

          {addPoll
              && (
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
                    return <Input disabled={!!feed?._id} key={poll?.description || poll} value={(poll._id ? poll.description : poll) || ''} className="poll-input" onChange={this.onChangePoll.bind(this, index)} />;
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
              )}
          <UploadList
            canAddMore={feed?.type === 'photo' || type === 'photo'}
            type={feed?.type || type}
            files={fileList}
            remove={this.remove.bind(this)}
            onAddMore={this.onAddMore.bind(this)}
            uploading={uploading}
          />
          <Form.Item>
            <Switch checkedChildren="PPV Content" unCheckedChildren="Free Content" checked={isSale} onChange={() => this.setState({ isSale: !isSale })} />
          </Form.Item>
          {isSale && (
            <Form.Item label="Amount of Tokens" name="price" rules={[{ required: isSale, message: 'Please add tokens' }]}>
              <InputNumber min={1} />
            </Form.Item>
          )}
          {thumbnail && (
          <Form.Item label="Thumbnail">
            <img alt="thumbnail" src={thumbnail} width="100px" />
          </Form.Item>
          )}
          {this.teaser && (
            <Form.Item label="Teaser">
              <div className="f-upload-list">
                <div className="f-upload-item">
                  <div className="f-upload-thumb">
                    <span className="f-thumb-vid">
                      <PlayCircleOutlined />
                    </span>
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
              className="primary"
              htmlType="submit"
              loading={uploading}
              disabled={uploading}
            >
              {!feed ? 'Post' : 'Update'}
            </Button>
            {(!feed || !feed._id) && (
            <Button
              onClick={() => discard()}
              className="secondary"
              disabled={uploading}
            >
              Discard
            </Button>
            )}
          </div>
        </Form>
      </div>
    );
  }
}
