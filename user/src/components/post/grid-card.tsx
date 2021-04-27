import { PureComponent } from 'react';
import {
  HeartOutlined, CommentOutlined, LockOutlined, UnlockOutlined,
  FileImageOutlined, VideoCameraOutlined, QuestionCircleOutlined
} from '@ant-design/icons';
import { Popover } from 'antd';
import Link from 'next/link';
import { videoDuration } from '@lib/index';
import { IFeed } from '../../interfaces';
import './index.less';

function thoudsandToK(value: number) {
  if (value < 1000) return value;
  return (`${(value / 1000).toFixed(1)}K`);
}

interface IProps {
  feed: IFeed;
}

export class FeedGridCard extends PureComponent<IProps> {
  render() {
    const { feed } = this.props;
    const images = feed.files && feed.files.filter((f) => f.type === 'feed-photo');
    const videos = feed.files && feed.files.filter((f) => f.type === 'feed-video');
    return (
      <div className="grid-card" key={feed._id}>
        <Link
          href={{ pathname: '/post', query: { id: feed._id } }}
          as={`/post/${feed._id}`}
        >
          <div className="card-thumb" style={feed?.thumbnailUrl && { backgroundImage: `url(${feed?.thumbnailUrl})` }}>
            {((!feed.isSale && !feed.isSubscribed) || (feed.isSale && !feed.isBought)) ? (
              <div className="text-center">
                <LockOutlined />
              </div>
            ) : (
              <div className="text-center">
                <UnlockOutlined />
              </div>
            )}
            <span className="feed-info">
              <Popover content={feed.text} title={null}>
                <QuestionCircleOutlined />
              </Popover>
            </span>
            <div className="card-bottom">
              <div className="stats">
                <a>
                  <HeartOutlined />
                  {' '}
                  {feed.totalLike > 0 ? thoudsandToK(feed.totalLike) : 0}
                </a>
                <a>
                  <CommentOutlined />
                  {' '}
                  {feed.totalComment > 0 ? thoudsandToK(feed.totalComment) : 0}
                </a>
              </div>

              {feed.files && feed.files.length > 0 && (
                <span className="count-media-item">
                  {images.length > 0 && (
                  <span>
                    {images.length > 1 && images.length}
                    {' '}
                    <FileImageOutlined />
                    {' '}
                  </span>
                  )}
                  {videos.length > 0 && images.length > 0 && '|'}
                  {videos.length > 0 && (
                  <span>
                    <VideoCameraOutlined />
                    {' '}
                    {videos.length === 1 && videoDuration(videos[0]?.duration)}
                  </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }
}
