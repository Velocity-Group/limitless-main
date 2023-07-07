import * as sharp from 'sharp';

export class ImageService {
  public async createThumbnail(filePath: string, options?: {
    width?: number;
    height?: number;
    toPath?: string;
  }) {
    // eslint-disable-next-line no-param-reassign
    options = options || {
      width: 200, // TODO - from config
      height: 200
    };

    if (options.toPath) {
      return sharp(filePath)
        .resize(options.width, options.height, { fit: 'inside' })
        .toFile(options.toPath);
    }

    return sharp(filePath)
      .resize(options.width, options.height, { fit: 'inside' })
      .toBuffer();
  }

  public async getMetaData(filePath: string) {
    return sharp(filePath).metadata();
  }

  public async replaceWithoutExif(filePath: string) {
    return sharp(filePath)
      .rotate()
      .toBuffer();
  }

  // generate video watermark - do not jpg
  public async generateImagePattern(textPattern, options) {
    const { width = 750, height = 750 } = options || {};
    const text = textPattern;
    let textStr = '';
    let textSpan = '';
    const textLength = 10;
    const textHeight = 100;
    const textSpace = 10;

    for (let j = 0; j < width; j += textLength) {
      textStr += ` ${text}`;
    }

    for (let i = 0; i < height; i += textHeight + textSpace) {
      textSpan += `<tspan x="0" y="${i}">${textStr}</tspan>`;
    }
    const svgImage = `
    <svg width="${width}" height="${height}">
      <style>
      .title { fill: #fff; font-size: 30px; opacity: 1}
      </style>
      <text x="0" y="0" text-anchor="middle" class="title">${textSpan}</text>
    </svg>
    `;
    const svgBuffer = Buffer.from(svgImage);
    return sharp(svgBuffer)
      .toBuffer();
  }
}
