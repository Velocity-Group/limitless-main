import { MutableRefObject } from 'react';
import {
  Spin, Image
} from 'antd';
import {
  useKeenSlider,
  KeenSliderPlugin,
  KeenSliderInstance
} from 'keen-slider/react';
import {
  PlusCircleOutlined, MinusCircleOutlined, RotateLeftOutlined, RotateRightOutlined
} from '@ant-design/icons';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import 'keen-slider/keen-slider.min.css';
import './index.less';

interface IProps {
  // eslint-disable-next-line react/require-default-props
  localImageFiles?: any[];
  photos: {
    _id: string;
    name: string;
    url: string;
    thumbnail?: string;
  }[];
  thumbSpacing?: number;
}

function ThumbnailPlugin(
  mainRef: MutableRefObject<KeenSliderInstance | null>
): KeenSliderPlugin {
  return (slider) => {
    function removeActive() {
      slider.slides.forEach((slide) => {
        slide.classList.remove('active');
      });
    }
    function addActive(idx: number) {
      slider.slides[idx].classList.add('active');
    }

    function addClickEvents() {
      slider.slides.forEach((slide, idx) => {
        slide.addEventListener('click', () => {
          if (mainRef.current) mainRef.current.moveToIdx(idx);
        });
      });
    }

    slider.on('created', () => {
      if (!mainRef.current) return;
      addActive(slider.track.details.rel);
      addClickEvents();
      mainRef.current.on('animationStarted', (main) => {
        removeActive();
        const next = main.animator.targetIdx || 0;
        addActive(main.track.absToRel(next));
        slider.moveToIdx(next);
      });
    });
  };
}

export const ImagesViewer = ({ photos, thumbSpacing = 12, localImageFiles }: IProps) => {
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    slides: {
      perView: 1,
      origin: 'center'
    }
  });
  const [thumbnailRef] = useKeenSlider<HTMLDivElement>(
    {
      mode: 'free',
      initial: 0,
      slides: {
        perView: 4.5,
        spacing: thumbSpacing
      },
      breakpoints: {
        '(min-width: 320px)': {
          slides: { perView: 4.5, spacing: 5 }
        },
        '(min-width: 500px)': {
          slides: { perView: 5.5, spacing: thumbSpacing }
        }
      }
    },
    [ThumbnailPlugin(instanceRef)]
  );

  return (
    <>
      <PhotoProvider
        maskClosable={false}
        pullClosable
        speed={() => 300}
        easing={() => 'ease-in-out'}
        toolbarRender={({
          onScale, scale, rotate, onRotate
        }) => (
          <>
            <PlusCircleOutlined className="PhotoView-Slider__toolbarIcon" onClick={() => onScale(scale + 1)} />
            <MinusCircleOutlined className="PhotoView-Slider__toolbarIcon" onClick={() => onScale(scale - 1)} />
            <RotateLeftOutlined className="PhotoView-Slider__toolbarIcon" onClick={() => onRotate(rotate - 90)} />
            <RotateRightOutlined className="PhotoView-Slider__toolbarIcon" onClick={() => onRotate(rotate + 90)} />
          </>
        )}
        loadingElement={<Spin />}
        brokenElement={<p style={{ color: '#fff' }}>Oops! Photo is broken</p>}
      >
        <div ref={sliderRef} className="keen-slider photos">
          {localImageFiles?.length
            ? localImageFiles?.map((img) => (
              <PhotoView
                key={img.uid}
                src={img.thumbnail}
              >
                <Image
                  key={img.uid}
                  className="keen-slider__slide"
                  src={img.thumbnail}
                  preview={false}
                  fallback="/static/no-image.jpg"
                />
              </PhotoView>
            ))
            : photos.map((img) => (
              <PhotoView
                key={img._id}
                src={img.url}
              >
                <Image
                  key={img._id}
                  className="keen-slider__slide"
                  src={img.url}
                  preview={false}
                  fallback="/static/no-image.jpg"
                />
              </PhotoView>
            ))}
        </div>
      </PhotoProvider>
      {localImageFiles?.length && localImageFiles?.length > 1
        ? (
          <div className="padding-thumbnails">
            <div ref={thumbnailRef} className="keen-slider thumbnails">
              {localImageFiles?.map((img) => (
                <img
                  className="keen-slider__slide"
                  key={img.uid}
                  src={img.thumbnail}
                  alt="thumb"
                />
              ))}
            </div>
          </div>
        ) : photos.length > 1 && (
        <div className="padding-thumbnails">
          <div ref={thumbnailRef} className="keen-slider thumbnails">
            {photos.map((img) => (
              <img
                className="keen-slider__slide"
                key={img._id}
                src={img.url}
                alt="thumb"
              />
            ))}
          </div>
        </div>
        )}
    </>
  );
};

ImagesViewer.defaultProps = {
  thumbSpacing: 12
};
