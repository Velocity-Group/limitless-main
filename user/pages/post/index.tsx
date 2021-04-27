import Head from 'next/head';
import { PureComponent } from 'react';
import {
  message, Layout
} from 'antd';
import { feedService } from '@services/index';
import Page from '@components/common/layout/page';
import { connect } from 'react-redux';
import {
  IFeed, IUIConfig, IUser
} from '@interfaces/index';
import FeedCard from '@components/post/post-card';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Router from 'next/router';
import { redirectToErrorPage } from '@redux/system/actions';

interface IProps {
  ui: IUIConfig;
  feed: IFeed;
  user: IUser;
  redirectToErrorPage: Function;
}

class PostDetails extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  static async getInitialProps({ ctx }) {
    try {
      const feed = await (await feedService.findOne(ctx.query.id, { Authorization: ctx.token })).data;
      return { feed };
    } catch (e) {
      return { ctx };
    }
  }

  async componentDidMount() {
    const { feed, redirectToErrorPage: handleRedirect } = this.props;
    if (!feed) {
      return handleRedirect({
        url: '/error',
        error: {
          statusCode: 404,
          message: 'Your requested link does not exist!'
        }
      });
    }
    return false;
  }

  async onDelete(feed: IFeed) {
    const { user } = this.props;
    if (user._id !== feed.fromSourceId) {
      return message.error('Permission denied');
    }
    if (!window.confirm('Are you sure to delete this post?')) return false;
    try {
      await feedService.delete(feed._id);
      message.success('Deleted the post successfully');
      Router.back();
    } catch {
      message.error('Something went wrong, please try again later');
    }
    return undefined;
  }

  render() {
    const { feed, ui } = this.props;
    const { performer } = feed;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName} | ${performer?.name}`}
          </title>
          <meta
            name="keywords"
            content={`${performer?.name}, ${performer?.username}, ${feed?.text}`}
          />
          <meta
            name="description"
            content={feed?.text}
          />
          {/* OG tags */}
          <meta
            property="og:title"
            content={`${performer?.name}, ${performer?.username}`}
            key="title"
          />
          <meta
            property="og:keywords"
            content={`${performer?.name}, ${performer?.username}, ${feed?.text}`}
          />
          <meta
            property="og:description"
            content={feed?.text}
          />
        </Head>
        <div className="main-container">
          <Page>
            <div className="page-heading">
              <a aria-hidden onClick={() => Router.back()}>
                <ArrowLeftOutlined />
                {' '}
                {`${performer?.name} post`}
              </a>
            </div>
            <div className="main-container custom">
              <FeedCard feed={feed} onDelete={this.onDelete.bind(this)} />
            </div>
          </Page>
        </div>
      </Layout>
    );
  }
}
const mapStates = (state) => ({
  ui: { ...state.ui },
  user: state.user.current
});
const dispatch = {
  redirectToErrorPage
};
export default connect(mapStates, dispatch)(PostDetails);
