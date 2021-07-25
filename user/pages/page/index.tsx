/* eslint-disable react/no-danger */
import { PureComponent } from 'react';
import Head from 'next/head';
import { Layout, message, Spin } from 'antd';
import { ReadOutlined } from '@ant-design/icons';
import { postService } from '@services/post.service';
import { connect } from 'react-redux';
import PageHeading from '@components/common/page-heading';

interface IProps {
  ui: any;
  id: string;
}
class PostDetail extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  state = {
    fetching: false,
    post: null
  };

  static async getInitialProps({ ctx }: any) {
    const { query } = ctx;
    return query;
  }

  async componentDidMount() {
    this.getPost();
  }

  async componentDidUpdate(prevProps: IProps) {
    const { id } = this.props;
    if (prevProps.id !== id) {
      this.getPost();
    }
  }

  async getPost() {
    const { id } = this.props;
    try {
      await this.setState({ fetching: true });
      const resp = await postService.findById(id as string);
      this.setState({ post: resp.data });
    } catch (e) {
      message.error('Page not found!');
    } finally {
      this.setState({ fetching: false });
    }
  }

  render() {
    const { post, fetching } = this.state;
    const { ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName} | ${post?.title || ''}`}
          </title>
        </Head>
        <div className="main-container">
          <div className="page-container">
            <PageHeading title={post?.title || 'Not found'} icon={<ReadOutlined />} />
            <div
              className="page-content"
              dangerouslySetInnerHTML={{ __html: post?.content }}
            />
            {fetching && <div><Spin /></div>}
          </div>
        </div>
      </Layout>
    );
  }
}
const mapProps = (state: any) => ({
  ui: { ...state.ui }
});

export default connect(mapProps)(PostDetail);
