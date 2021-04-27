/* eslint-disable no-restricted-globals */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { PureComponent } from 'react';
import {
  Upload, message, Button,
  Input, Form, Col, Row
} from 'antd';
import {
  FileAddOutlined, SmileOutlined, BgColorsOutlined
} from '@ant-design/icons';
import { IUser, IPerformer, IStory } from 'src/interfaces';
import { storyService } from '@services/index';
import './index.less';
import { connect } from 'react-redux';
import { addStorySuccess } from '@redux/story/actions';
import { Emotions } from '@components/messages/emotions';
import StoryBackgroundForm from './background-form';
import StoryColorPicker from './story-text-color';

const { TextArea } = Input;
interface IProps {
  user: IUser | IPerformer;
  feed?: IStory;
  onCloseModal: Function;
  addStorySuccess: Function;
}
const validateMessages = {
  required: 'This field is required!'
};

class StoryForm extends PureComponent<IProps> {
  state = {
    text: '',
    uploading: false,
    fileIds: [],
    backgroundUrl: '/static/story-img/1.jpg',
    textColor: '#fff'
  };

  componentDidMount() {
    const { feed } = this.props;
    if (feed) {
      this.setState({
        backgroundUrl: feed.backgroundUrl,
        textColor: feed.textColor,
        text: feed.text,
        fileIds: feed.fileIds ? feed.fileIds : []
      });
    }
  }

  onUploading(file, resp: any) {
    file.percent = resp.percentage;
    if (file.percent === 100) file.status = 'done';
    this.forceUpdate();
  }

  async onsubmit(feed, values) {
    const { addStorySuccess: handleAddStory, user } = this.props;
    try {
      const resp = !feed ? await storyService.create(values) : await storyService.update(feed._id, values);
      message.success('Posted success!');
      handleAddStory({ story: { ...resp.data, performer: user } });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Something went wrong, please try again later');
    } finally {
      this.onDiscard();
    }
  }

  onEmojiClick = (emojiObject) => {
    const { text } = this.state;
    this.setState({ text: `${text} ${emojiObject.emoji}` });
  }

  onDiscard = () => {
    const { onCloseModal } = this.props;
    onCloseModal();
    this.setState({
      text: '',
      uploading: false,
      fileIds: [],
      backgroundUrl: '/static/story-img/1.jpg',
      textColor: '#fff'
    });
  }

  async beforeUpload(file, fileList) {
    const { fileIds } = this.state;
    if (!fileList.length) {
      return;
    }
    if (fileList.indexOf(file) === (fileList.length - 1)) {
      // const files = await Promise.all(fileList.map((f) => {
      //   if (f._id) return f;
      //   const reader = new FileReader();
      //   reader.addEventListener('load', () => { f.thumbnail = reader.result; });
      //   reader.readAsDataURL(f);
      //   return f;
      // })) as any;
      await this.setState({ uploading: true });
      const newFileIds = [...fileIds];
      for (const newFile of fileList) {
        try {
          if (['uploading', 'done'].includes(newFile.status) || newFile._id) continue;
          newFile.status = 'uploading';
          const resp = (newFile.type.indexOf('image') > -1 ? await storyService.uploadPhoto(
            newFile,
            {},
            this.onUploading.bind(this, newFile)
          ) : await storyService.uploadVideo(
            newFile,
            {},
            this.onUploading.bind(this, newFile)
          )) as any;
          await this.setState({ backgroundUrl: resp.data.url });
          newFileIds.push(resp.data._id);
          newFile._id = resp.data._id;
        } catch (e) {
          message.error(`File ${newFile.name} error!`);
        } finally {
          this.forceUpdate();
          await this.setState({ uploading: false, fileIds: newFileIds });
        }
      }
    }
  }

  async submit(formValues: any) {
    const { feed } = this.props;
    if (!formValues.text.trim()) {
      return message.error('Please add a caption');
    }
    await this.setState({ uploading: true });
    return this.onsubmit(feed, formValues);
  }

  render() {
    const { feed } = this.props;
    const {
      uploading, fileIds, text, backgroundUrl, textColor
    } = this.state;
    return (
      <div className="story-form">
        <Form
          onFinish={(values) => {
            values.fileIds = fileIds;
            values.type = 'photo';
            values.textColor = textColor;
            values.backgroundUrl = backgroundUrl;
            values.text = text;
            this.submit(values);
          }}
          validateMessages={validateMessages}
          initialValues={feed || ({
            text: ''
          } as IStory)}
        >
          <Row className="form-content">
            <Col lg={12} md={12} sm={24} xs={24}>
              <div>
                <Form.Item rules={[{ required: true, message: 'Please add caption here' }]}>
                  <div className="input-f-desc">
                    <TextArea value={text} autoFocus rows={3} onChange={(e) => this.setState({ text: e.target.value })} className="feed-input" placeholder="Add caption here" allowClear />
                    <span className="grp-emotions">
                      <SmileOutlined />
                      <Emotions onEmojiClick={this.onEmojiClick.bind(this)} />
                    </span>
                    <span className="grp-colors">
                      <BgColorsOutlined />
                      <StoryColorPicker onChangeColor={(color) => this.setState({ textColor: color?.hex ? color.hex : color })} />
                    </span>
                  </div>
                </Form.Item>
                <StoryBackgroundForm onChangeUrl={(url) => this.setState({ backgroundUrl: url })} />

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
                    <FileAddOutlined />
                    {' '}
                    Custom your background
                  </Button>
                </Upload>
              </div>
            </Col>
            <Col lg={12} md={12} sm={24} xs={24} style={{ display: 'flex' }}>
              <div className="preview-canvas" style={{ backgroundImage: `url(${backgroundUrl || '/static/story-img/1.jpg'})` }}>
                <div className="preview-text" style={{ color: textColor }}>{text || 'Please add a caption'}</div>
              </div>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              className="secondary"
              type="default"
              disabled={uploading}
              onClick={() => {
                if (!confirm('Are you sure you want to discard?')) return;
                this.onDiscard();
              }}
            >
              Discard
            </Button>
            &nbsp;
            <Button
              className="primary"
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

const mapStates = (state: any) => ({
  user: state.user.current
});

const mapDispatch = {
  addStorySuccess
};
export default connect(mapStates, mapDispatch)(StoryForm);
