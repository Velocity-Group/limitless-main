import {
  LockOutlined, UnlockOutlined
} from '@ant-design/icons';
import { Image } from 'antd';
import Link from 'next/link';
import { IFeed } from 'src/interfaces';
import './index.less';

interface IProps {
  feed: IFeed
}
const CardFeedTrending = ({ feed }: IProps) => {
  const canView = (!feed.isSale && feed.isSubscribed) || (feed.isSale && feed.isBought);
  const images = feed.files && feed.files.filter((f) => f.type === 'feed-photo');
  const videos = feed.files && feed.files.filter((f) => f.type === 'feed-video');
  const thumbUrl = (canView ? ((images && images[0] && images[0]?.url) || (videos && videos[0] && videos[0]?.thumbnails))
    : (images && images[0] && images[0]?.thumbnails && images[0]?.thumbnails[0]) || (videos && videos[0] && videos[0]?.thumbnails && videos[0]?.thumbnails[0]))
    || '/static/leaf.jpg';
  return (
    <div className="feed-trending-grid-card" key={feed._id}>
      <Link
        href={{ pathname: '/post', query: { id: feed.slug || feed._id } }}
        as={`/post/${feed.slug || feed._id}`}
      >

        <div className="card-trending-thumb">
          <div className="trending-card-bg" style={{ backgroundImage: `url(${thumbUrl})`, filter: !canView ? 'blur(20px)' : 'blur(0px)' }} />
          {feed.isSale && feed.price > 0 && (
            <div className="trending-bagde">
              <p className="trending-category-bg">
                $
                {' '}
                {(feed.price || 0).toFixed(2)}
              </p>
            </div>
          )}
          <div className="card-middle">
            {canView ? <UnlockOutlined /> : <LockOutlined />}
          </div>
          <div className="card-bottom">
            <div className="stats-profile">
              <Image
                preview={false}
                alt="main-avt"
                src={feed.performer?.avatar || '/static/no-avatar.png'}
                fallback="/static/no-avatar.png"
              />
              <h5>{feed.performer.username || 'n/a'}</h5>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CardFeedTrending;
