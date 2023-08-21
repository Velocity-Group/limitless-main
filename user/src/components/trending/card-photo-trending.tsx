import {
  LockOutlined, UnlockOutlined
} from '@ant-design/icons';
import { Image } from 'antd';
import Link from 'next/link';
import { IGallery } from 'src/interfaces';
import './index.less';

interface IProps {
  gallery : IGallery
}

const CardPhotoTrending = ({ gallery }: IProps) => {
  const canView = (!gallery.isSale && gallery.isSubscribed) || (gallery.isSale && gallery.isBought);
  const thumbUrl = (!canView
    ? gallery?.coverPhoto?.thumbnails && gallery?.coverPhoto?.thumbnails[0]
    : gallery?.coverPhoto?.url) || '/static/leaf.jpg';

  return (
    <div className="gallery-trending-grid-card" key={gallery._id}>
      <Link
        href={{
          pathname: '/gallery',
          query: { id: gallery?.slug || gallery?._id }
        }}
        as={`/gallery/${gallery?.slug || gallery?._id}`}
      >
        <div className="card-trending-thumb">
          {/* eslint-disable-next-line no-nested-ternary */}
          <div className="trending-card-bg" style={{ backgroundImage: `url(${thumbUrl})`, filter: !canView ? 'blur(20px)' : 'blur(0px)' }} />
          {gallery.isSale && gallery.price > 0 && (
            <div className="trending-bagde">
              <p className="trending-category-bg">
                $
                {' '}
                {(gallery.price || 0).toFixed(2) }
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
                src={gallery.performer?.avatar || '/static/no-avatar.png'}
                fallback="/static/no-avatar.png"
              />
              <h5>{gallery.performer.username || 'n/a'}</h5>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CardPhotoTrending;
