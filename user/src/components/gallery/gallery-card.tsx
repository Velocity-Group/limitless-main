import React from 'react';
import { IGallery } from 'src/interfaces';
import './gallery.less';

interface GalleryCardIProps {
  gallery: IGallery;
}

const GalleryCard = ({ gallery }: GalleryCardIProps) => {
  const thumbUrl = gallery.coverPhoto && gallery.coverPhoto.thumbnails.length ? gallery.coverPhoto.thumbnails[0] : '/placeholder-image.jpg';

  return (
    <div className="gallery-card">
      <div className="gallery-cover">
        <img src={thumbUrl} alt={gallery.name} />
      </div>
      <div className="gallery-name">{gallery.name}</div>
    </div>
  );
};
export default GalleryCard;
