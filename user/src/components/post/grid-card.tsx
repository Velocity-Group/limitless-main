import { PureComponent } from 'react';
import {
  HeartOutlined, CommentOutlined, LockOutlined, UnlockOutlined,
  FileImageOutlined, VideoCameraOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { Popover } from 'antd';
import Link from 'next/link';
import { videoDuration, shortenLargeNumber } from '@lib/index';
import { IFeed } from '../../interfaces';
import './index.less';

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
          href={{ pathname: '/post', query: { id: feed.slug || feed._id } }}
          as={`/post/${feed.slug || feed._id}`}
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
                <InfoCircleOutlined />
              </Popover>
            </span>
            <div className="card-bottom">
              <div className="stats">
                <a>
                  <HeartOutlined />
                  {' '}
                  {feed.totalLike > 0 ? shortenLargeNumber(feed.totalLike) : 0}
                </a>
                <a>
                  <CommentOutlined />
                  {' '}
                  {feed.totalComment > 0 ? shortenLargeNumber(feed.totalComment) : 0}
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
