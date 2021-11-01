import { PureComponent } from 'react';
import {
  HeartOutlined, CommentOutlined, LockOutlined, UnlockOutlined,
  FileImageOutlined, VideoCameraOutlined
} from '@ant-design/icons';
import { Button } from 'antd';
import Link from 'next/link';
import { videoDuration, shortenLargeNumber } from '@lib/index';
import { IFeed } from 'src/interfaces';
import './index.less';

interface IProps {
  feed: IFeed;
}

export class FeedGridCard extends PureComponent<IProps> {
  render() {
    const { feed } = this.props;
    const canView = (!feed.isSale && feed.isSubscribed) || (feed.isSale && feed.isBought);
    const images = feed.files && feed.files.filter((f) => f.type === 'feed-photo');
    const videos = feed.files && feed.files.filter((f) => f.type === 'feed-video');
    const thumbUrl = (canView ? ((feed?.thumbnail?.url) || (images && images[0] && images[0]?.url) || (feed?.teaser && feed?.teaser?.thumbnails && feed?.teaser?.thumbnails[0]))
      : (feed?.thumbnail?.thumbnails && feed?.thumbnail?.thumbnails[0]) || (images && images[0] && images[0]?.thumbnails && images[0]?.thumbnails[0]) || (videos && videos[0] && videos[0]?.thumbnails && videos[0]?.thumbnails[0]))
     || '/static/leaf.jpg';
    return (
      <div className="feed-grid-card" key={feed._id}>
        <Link
          href={{ pathname: '/post', query: { id: feed.slug || feed._id } }}
          as={`/post/${feed.slug || feed._id}`}
        >
          <div className="card-thumb">
            {/* eslint-disable-next-line no-nested-ternary */}
            <div className="card-bg" style={{ backgroundImage: `url(${thumbUrl})`, filter: !canView ? 'blur(20px)' : 'blur(0px)' }} />
            <div className="card-middle">
              {canView ? <UnlockOutlined /> : <LockOutlined />}
              {(!feed.isSale && !feed.isSubscribed) && <Button type="link">Subscribe to unlock</Button>}
              {(feed.isSale && !feed.isBought) && <Button type="link">Pay now to unlock</Button>}
            </div>
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
