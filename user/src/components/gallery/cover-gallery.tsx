/* eslint-disable react/destructuring-assignment */
import { PureComponent } from 'react';
import { IGallery } from 'src/interfaces';

interface IProps {
  gallery?: IGallery;
  style?: Record<string, string>;
}

export class CoverGallery extends PureComponent<IProps> {
  render() {
    const { gallery, style } = this.props;
    const url = gallery?.coverPhoto?.thumbnails ? gallery?.coverPhoto?.thumbnails[0]
      : '/static/no-image.jpg';
    return (
      <img
        alt="Cover"
        src={url}
        style={style || { width: 50, borderRadius: '3px' }}
      />
    );
  }
}
