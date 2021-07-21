import React from 'react';
import { Tooltip } from 'antd';
import { IGallery } from 'src/interfaces';
import Link from 'next/link';
import '@components/video/video.less';

interface GalleryCardIProps {
  gallery: IGallery;
}

const GalleryCard = ({ gallery }: GalleryCardIProps) => {
  const thumbUrl = gallery?.coverPhoto?.thumbnails[0] || '/static/placeholder-image.jpg';
  return (
    <Link
      href={{ pathname: '/gallery', query: { id: gallery?.slug || gallery?._id } }}
      as={`/gallery/${gallery?.slug || gallery?._id}`}
    >
      <div className="vid-card">
        {gallery?.isSale && gallery?.price > 0 && (
        <span className="vid-price">
          <div className="label-price">
            <img alt="coin" src="/static/coin-ico.png" width="15px" />
            {gallery?.price.toFixed(2)}
          </div>
        </span>
        )}
        <div className="vid-thumb" style={{ backgroundImage: `url(${thumbUrl})` }}>
          {/* <div className="vid-stats">
              <span>
                <a>
                  <EyeOutlined />
                  {' '}
                  {video?.stats?.views || 0}
                </a>
                <a>
                  <LikeOutlined />
                  {' '}
                  {video?.stats?.likes || 0}
                </a>
              </span>
            </div> */}
        </div>
        <div className="vid-info">
          <Tooltip title={gallery.title}>
            <Link
              href={{ pathname: '/gallery', query: { id: gallery?.slug || gallery?._id } }}
              as={`/gallery/${gallery?.slug || gallery?._id}`}
            >
              <span>{gallery?.title}</span>
            </Link>
          </Tooltip>
        </div>
      </div>
    </Link>
  );
};
export default GalleryCard;
