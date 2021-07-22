import { Image } from 'antd';
import { IPhotos } from 'src/interfaces';
import './index.less';

interface IProps {
  photos: IPhotos[];
  isBlur: boolean;
}

const PhotoPreviewList = ({
  photos, isBlur
}: IProps) => (
  <div className={!isBlur ? 'list-photos' : 'list-photos blur'}>
    <Image.PreviewGroup>
      {photos.map((item) => (
        <Image
          key={item._id}
          className="photo-card"
          src={(item?.photo?.thumbnails && item?.photo?.thumbnails[0]) || item?.photo?.url}
          preview={isBlur ? false : {
            src: item?.photo?.url || (item?.photo?.thumbnails && item?.photo?.thumbnails[0])
          }}
        />
      ))}
    </Image.PreviewGroup>
  </div>
);
export default PhotoPreviewList;
