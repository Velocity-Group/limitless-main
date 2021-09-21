import React from 'react';
import { Tooltip, Button } from 'antd';
import { PictureOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { IGallery } from 'src/interfaces';
import Link from 'next/link';
import './gallery.less';

interface GalleryCardIProps {
  gallery: IGallery;
}

const GalleryCard = ({ gallery }: GalleryCardIProps) => {
  const canView = (!gallery.isSale && gallery.isSubscribed) || (gallery.isSale && gallery.isBought);
  const thumbUrl = (gallery?.coverPhoto?.thumbnails && gallery?.coverPhoto?.thumbnails[0]) || '/static/no-image.jpg';
  return (
    <Link
      href={{ pathname: '/gallery', query: { id: gallery?.slug || gallery?._id } }}
      as={`/gallery/${gallery?.slug || gallery?._id}`}
    >
      <div className="gallery-card">
        {gallery?.isSale && gallery?.price > 0 && (
        <span className="gallery-price">
          <div className="label-price">
            <img alt="coin" src="/static/coin-ico.png" width="15px" />
            {gallery?.price.toFixed(2)}
          </div>
        </span>
        )}
        <div className="gallery-thumb">
          <div className="card-bg" style={canView ? { backgroundImage: `url(${thumbUrl})` } : { backgroundImage: `url(${thumbUrl})`, filter: 'blur(20px)' }} />
          <div className="gallery-stats">
            <a>
              <PictureOutlined />
              {' '}
              {gallery?.numOfItems || 0}
            </a>
          </div>
          <div className="lock-middle">
            {canView ? <UnlockOutlined /> : <LockOutlined />}
            {(!gallery.isSale && !gallery.isSubscribed) && <Button type="link">Subscribe to unlock</Button>}
            {(gallery.isSale && !gallery.isBought) && <Button type="link">Pay now to unlock</Button>}
          </div>
        </div>
        <div className="gallery-info">
          <Tooltip title={gallery?.title}>
            <span>{gallery?.title}</span>
          </Tooltip>
        </div>
      </div>
    </Link>
  );
};
export default GalleryCard;
