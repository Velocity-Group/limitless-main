import Head from 'next/head';
import { PureComponent } from 'react';
import { Layout } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { feedService } from '@services/index';
import { connect } from 'react-redux';
import { IFeed, IUIConfig } from '@interfaces/index';
import FeedForm from '@components/post/form';
import Router from 'next/router';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  feed: IFeed;
  intl: IntlShape;
}

class EditPost extends PureComponent<IProps> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps({ ctx }) {
    try {
      const feed = await (
        await feedService.findById(ctx.query.id, { Authorization: ctx.token })
      ).data;
      return { feed };
    } catch (e) {
      return { ctx };
    }
  }

  componentDidMount() {
    const { feed } = this.props;
    if (!feed) {
      Router.back();
    }
  }

  render() {
    const { feed, ui, intl } = this.props;
    return (
      <>
        {feed && (
          <Layout>
            <Head>
              <title>
                {ui?.siteName}
                {' '}
                |
                {' '}
                {intl.formatMessage({
                  id: 'editPost',
                  defaultMessage: 'Edit Post'
                })}
              </title>
            </Head>
            <div className="main-container">
              <PageHeading
                icon={<ArrowLeftOutlined />}
                title={` ${intl.formatMessage({
                  id: 'editPost',
                  defaultMessage: 'Edit Post'
                })}`}
              />
              <div>
                <FeedForm feed={feed} />
              </div>
            </div>
          </Layout>
        )}
      </>
    );
  }
}
const mapStates = (state) => ({
  ui: { ...state.ui }
});
export default injectIntl(connect(mapStates)(EditPost));
