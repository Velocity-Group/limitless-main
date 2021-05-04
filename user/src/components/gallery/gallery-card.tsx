import { IGallery } from 'src/interfaces';
import './gallery.less';

interface GalleryCardIProps {
  gallery: IGallery;
  onShow: Function;
}

const GalleryCard = ({ gallery, onShow }: GalleryCardIProps) => {
  const thumbUrl = gallery.coverPhoto && gallery.coverPhoto.thumbnails.length ? gallery.coverPhoto.thumbnails[0] : '/gallery.png';

  return (
    <div aria-hidden className="gallery-card" onClick={() => onShow(gallery)}>
      <div className="gallery-cover">
        <img src={thumbUrl} alt={gallery.title} />
      </div>
      <div className="gallery-name">
        {gallery.title}
      </div>
    </div>
  );
};
export default GalleryCard;
