/* eslint-disable react/no-array-index-key */
import { PureComponent } from 'react';
import { IVideoResponse } from 'src/interfaces';
import './video.less';

interface IProps {
  video: IVideoResponse;
}

export class ThumbnailVideo extends PureComponent<IProps> {
  render() {
    const { video: videoProp } = this.props;
    const { thumbnail, video } = videoProp;
    const url = thumbnail || video?.thumbnails[0] || '/static/placeholder-image.jpg';
    return (
      <div className="video-thumbs">
        {video.thumbnails && video.thumbnails.length > 0
          ? video.thumbnails.map((thumb) => <img alt="thumb" key={thumb} src={thumb} />)
          : <img alt="video" src={url} />}
      </div>
    );
  }
}
