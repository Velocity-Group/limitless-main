import Head from 'next/head';
import { PureComponent } from 'react';
import { Layout, message } from 'antd';
import PageHeading from '@components/common/page-heading';
import { connect } from 'react-redux';
import { IPerformer, IUIConfig } from '@interfaces/index';
import FeedForm from '@components/post/form';
import {
  PictureOutlined,
  VideoCameraOutlined,
  FireOutlined
} from '@ant-design/icons';
import Router from 'next/router';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  user: IPerformer;
  intl: IntlShape;
}

class CreatePost extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  state = {
    chosenType: false,
    type: ''
  };

  componentDidMount() {
    const { user, intl } = this.props;
    if (!user || !user.verifiedDocument) {
      message.warning(
        intl.formatMessage({
          id: 'yourIdDocumentsAreNotVerifiedYet',
          defaultMessage:
            'Your ID documents are not verified yet! You could not post any content right now.'
        })
      );
      Router.back();
    }
  }

  render() {
    const { ui, intl } = this.props;
    const { chosenType, type } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'newPost',
              defaultMessage: 'New Post'
            })}
          </title>
        </Head>
        <div className="main-container">
          <PageHeading
            icon={<FireOutlined />}
            title={` ${intl.formatMessage({
              id: 'new',
              defaultMessage: 'New'
            })} ${type} ${intl.formatMessage({
              id: 'post',
              defaultMessage: 'Post'
            })}`}
          />
          <div>
            {!chosenType ? (
              <div className="story-switch-type">
                <div
                  aria-hidden
                  className="type-item left"
                  onClick={() => this.setState({ type: 'photo', chosenType: true })}
                >
                  <span>
                    <PictureOutlined />
                  </span>
                  <p>{intl.formatMessage({ id: 'createAPhotoPost', defaultMessage: 'Create a Photo post' })}</p>
                </div>
                <div
                  aria-hidden
                  className="type-item right"
                  onClick={() => this.setState({ type: 'video', chosenType: true })}
                >
                  <span>
                    <VideoCameraOutlined />
                  </span>
                  <p>{intl.formatMessage({ id: 'createAVideoPost', defaultMessage: 'Create a Video post' })}</p>
                </div>
                <div
                  aria-hidden
                  className="type-item middle"
                  onClick={() => this.setState({ type: 'text', chosenType: true })}
                >
                  <span>Aa</span>
                  <p>{intl.formatMessage({ id: 'createATextPost', defaultMessage: 'Create a Text post' })}</p>
                </div>
              </div>
            ) : (
              <FeedForm
                type={type}
                discard={() => this.setState({ chosenType: false, type: '' })}
              />
            )}
          </div>
        </div>
      </Layout>
    );
  }
}
const mapStates = (state) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
  settings: { ...state.settings }
});
export default injectIntl(connect(mapStates)(CreatePost));
