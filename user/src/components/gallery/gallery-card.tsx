import React from 'react';
import { IGallery } from 'src/interfaces';
import Link from 'next/link';
import './gallery.less';

interface GalleryCardIProps {
  gallery: IGallery;
}

const GalleryCard = ({ gallery }: GalleryCardIProps) => {
  const thumbUrl = gallery.coverPhoto && gallery.coverPhoto.thumbnails.length ? gallery.coverPhoto.thumbnails[0] : '/placeholder-image.jpg';

  return (
    <div className="gallery-card">
      <Link
        href={{ pathname: '/gallery', query: { id: gallery?._id } }}
        as={`/gallery/${gallery?._id}`}
      >
        <a>
          <div className="gallery-cover">
            <img src={thumbUrl} alt={gallery.title} />
          </div>
          <div className="gallery-name">{gallery.title}</div>
        </a>
      </Link>
    </div>
  );
};
export default GalleryCard;
