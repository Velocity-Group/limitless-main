import Head from 'next/head';
import { PureComponent } from 'react';
import {
  Layout, message
} from 'antd';
import PageHeading from '@components/common/page-heading';
import { connect } from 'react-redux';
import { IPerformer, IUIConfig } from '@interfaces/index';
import FeedForm from '@components/post/form';
import {
  PictureOutlined, VideoCameraOutlined, FireOutlined
} from '@ant-design/icons';
import Router from 'next/router';

interface IProps {
  ui: IUIConfig;
  user: IPerformer;
}

class CreatePost extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  state = {
    chosenType: false,
    type: ''
  }

  componentDidMount() {
    const { user } = this.props;
    if (!user || !user.verifiedDocument) {
      message.warning('Your ID documents are not verified yet! You could not post any content right now.');
      Router.back();
    }
    if (!user?.stripeAccount?.payoutsEnabled || !user?.stripeAccount?.detailsSubmitted) {
      message.warning('You have not connected with stripe. So you cannot post any content right now!');
      Router.push('/model/banking');
    }
  }

  render() {
    const { ui } = this.props;
    const { chosenType, type } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            { ui?.siteName }
            {' '}
            | New Post
          </title>
        </Head>
        <div className="main-container">
          <PageHeading icon={<FireOutlined />} title={` New ${type} Post`} />
          <div>
            {!chosenType ? (
              <div className="story-switch-type">
                <div aria-hidden className="type-item left" onClick={() => this.setState({ type: 'photo', chosenType: true })}>
                  <span><PictureOutlined /></span>
                  <p>Create a Photo post</p>
                </div>
                <div aria-hidden className="type-item right" onClick={() => this.setState({ type: 'video', chosenType: true })}>
                  <span><VideoCameraOutlined /></span>
                  <p>Create a Video post</p>
                </div>
                <div aria-hidden className="type-item middle" onClick={() => this.setState({ type: 'text', chosenType: true })}>
                  <span>Aa</span>
                  <p>Create a Text post</p>
                </div>
              </div>
            ) : (<FeedForm type={type} discard={() => this.setState({ chosenType: false, type: '' })} />)}
          </div>
        </div>
      </Layout>
    );
  }
}
const mapStates = (state) => ({
  ui: { ...state.ui },
  user: { ...state.user.current }
});
export default connect(mapStates)(CreatePost);
