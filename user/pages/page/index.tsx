import { PureComponent } from 'react';
import Head from 'next/head';
import { Layout } from 'antd';
import { ReadOutlined } from '@ant-design/icons';
import { postService } from '@services/post.service';
import { connect } from 'react-redux';
import Router from 'next/router';
import { IPostResponse } from '@interfaces/post';
import PageHeading from '@components/common/page-heading';

interface IProps {
  ui: any;
  post: IPostResponse;
}
class PostDetail extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  static async getInitialProps({ ctx }: any) {
    const { query } = ctx;
    try {
      const post = await (await postService.findById(query.id)).data;
      return { post };
    } catch (e) {
      if (process.browser) {
        return Router.replace('/404');
      }

      ctx.res.writeHead && ctx.res.writeHead(302, { Location: '/404' });
      ctx.res.end && ctx.res.end();
      return {};
    }
  }

  componentDidMount(): void {
    if (window.iframely) {
      document.querySelectorAll('oembed[url]').forEach((element: any) => {
        window.iframely.load(element, element.attributes.url.value);
      });
      document.querySelectorAll('div[data-oembed-url]').forEach((element: any) => {
        // Discard the static media preview from the database (empty the <div data-oembed-url="...">).
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }

        // Generate the media preview using Iframely.
        window.iframely.load(element, element.dataset.oembedUrl);
      });
    }
  }

  render() {
    const { ui, post } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName} | ${post?.title || ''}`}
          </title>
          <script charSet="utf-8" src="//cdn.iframe.ly/embed.js?api_key=7c5c0f5ad6ebf92379ec3e" />
        </Head>
        <div className="main-container">
          <div className="page-container">
            <PageHeading title={post?.title || 'Page was not found'} icon={<ReadOutlined />} />
            <div
              className="page-content"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: post?.content }}
            />

          </div>
        </div>
      </Layout>
    );
  }
}

const mapProps = (state: any) => ({
  ui: state.ui
});

export default connect(mapProps)(PostDetail);
