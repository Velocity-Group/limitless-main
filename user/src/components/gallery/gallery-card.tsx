import { useState } from 'react';
import { Tooltip } from 'antd';
import {
  PictureOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { IGallery } from 'src/interfaces';
import Link from 'next/link';
import './gallery.less';

interface GalleryCardIProps {
  gallery: IGallery;
}

const GalleryCard = ({ gallery }: GalleryCardIProps) => {
  const [isHovered, setHover] = useState(false);
  const canView = (!gallery.isSale && gallery.isSubscribed)
    || (gallery.isSale && gallery.isBought);
  const thumbUrl = (!canView
    ? gallery?.coverPhoto?.thumbnails && gallery?.coverPhoto?.thumbnails[0]
    : gallery?.coverPhoto?.url) || '/static/no-image.jpg';
  return (
    <Link
      href={{
        pathname: '/gallery',
        query: { id: gallery?.slug || gallery?._id }
      }}
      as={`/gallery/${gallery?.slug || gallery?._id}`}
    >
      <div
        className="gallery-card"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {gallery?.isSale && gallery?.price > 0 && (
          <span className="gallery-price">
            <div className="label-price">
              <img alt="coin" src="/static/coin-ico.png" width="15px" />
              {gallery?.price.toFixed(2)}
            </div>
          </span>
        )}
        <div className="gallery-thumb">
          <div
            className="card-bg"
            style={{
              backgroundImage: `url(${thumbUrl})`,
              filter: canView ? 'blur(0px)' : 'blur(20px)'
            }}
          />
          <div className="gallery-stats">
            <a>
              <PictureOutlined />
              {' '}
              {gallery?.numOfItems || 0}
            </a>
          </div>
          <div className="lock-middle">
            {canView || isHovered ? <UnlockOutlined /> : <LockOutlined />}
          </div>
        </div>
        <Tooltip title={gallery?.title}>
          <div className="gallery-info">
            {gallery.title}
          </div>
        </Tooltip>
      </div>
    </Link>
  );
};
export default GalleryCard;
