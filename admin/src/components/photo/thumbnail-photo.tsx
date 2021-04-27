import { PureComponent } from 'react';
import { IPhotoUpdate } from 'src/interfaces';

interface IProps {
  photo?: IPhotoUpdate;
  style?: Record<string, string>;
}

export class ThumbnailPhoto extends PureComponent<IProps> {
  render() {
    const { style, photo } = this.props;
    const { photo: item } = photo;
    const urlThumb = item && item.thumbnails && item.thumbnails.length > 0
      ? item.thumbnails[0]
      : '/camera.png';
    return <img src={urlThumb} style={style || { width: 130 }} alt="thumb" />;
  }
}
