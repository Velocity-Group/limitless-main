import {
  LockOutlined, UnlockOutlined
} from '@ant-design/icons';
import { Image } from 'antd';
import Link from 'next/link';
import { IVideo } from 'src/interfaces';
import './index.less';

interface IProps {
  video : IVideo
}

const CardVideoTrending = ({ video }: IProps) => {
  const canView = (!video.isSale && video.isSubscribed) || (video.isSale && video.isBought);
  const thumbUrl = (canView ? video?.thumbnail?.url : (video?.thumbnail?.thumbnails && video?.thumbnail?.thumbnails[0])) || (video?.teaser?.thumbnails && video?.teaser?.thumbnails[0]) || (video?.video?.thumbnails && video?.video?.thumbnails[0]) || '/static/leaf.jpg';

  return (
    <div className="video-trending-grid-card" key={video._id}>
      <Link
        href={{ pathname: '/video', query: { id: video.slug || video._id } }}
        as={`/video/${video.slug || video._id}`}
      >
        <div className="card-trending-thumb">
          <div className="trending-card-bg" style={{ backgroundImage: `url(${thumbUrl})`, filter: !canView ? 'blur(20px)' : 'blur(0px)' }} />
          {video.isSale && video.price > 0 && (
            <div className="trending-bagde">
              <p className="trending-category-bg">
                $
                {' '}
                {(video.price || 0).toFixed(2)}
              </p>
            </div>
          ) }
          <div className="card-middle">
            {canView ? <UnlockOutlined /> : <LockOutlined />}
          </div>
          <div className="card-bottom">
            <div className="stats-profile">
              <Image
                preview={false}
                alt="main-avt"
                src={video.performer?.avatar || '/static/no-avatar.png'}
                fallback="/static/no-avatar.png"
              />
              <h5>{video.performer.username || 'n/a'}</h5>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CardVideoTrending;
