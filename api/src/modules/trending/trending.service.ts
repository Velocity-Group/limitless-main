import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { flattenDeep } from 'lodash';
import { TrendingSearchPayload } from './trending.payload';
import { UserDto } from '../user/dtos';
import { TRENDING_MODEL_PROVIDER } from './provider';
import { TrendingModel } from './trending.model';
import { FeedService } from '../feed/services';
import { GalleryService, ProductSearchService, VideoService } from '../performer-assets/services';
import { TRENDING_SOURCES } from './constants';

const moment = require('moment');

@Injectable()
export class TrendingService {
  constructor(
    @Inject(forwardRef(() => FeedService))
    private readonly feedService: FeedService,
    @Inject(forwardRef(() => VideoService))
    private readonly videoService: VideoService,
    @Inject(forwardRef(() => GalleryService))
    private readonly galleryService: GalleryService,
    @Inject(forwardRef(() => ProductSearchService))
    private readonly productService: ProductSearchService,
    @Inject(TRENDING_MODEL_PROVIDER)
    private readonly trendingModel: Model<TrendingModel>
  ) { }

  public async search(req: TrendingSearchPayload, user: UserDto, jwToken: string): Promise<any> {
    const { source = '', time = 'month' } = req;
    const query = {} as any;
    if (time === 'week') {
      query.createdAt = { $gte: moment().startOf('week').toDate() };
    }
    if (time === 'month') {
      query.createdAt = { $gte: moment().startOf('month').toDate() };
    }
    const sort = {
      totalViews: -1,
      totalLikes: -1,
      totalBookmarks: -1,
      createdAt: -1
    };

    if (source) {
      query.source = source;
      const data = await this.trendingModel.find(query)
        .limit(12)
        .skip(0)
        .sort(sort)
        .lean();

      const sourceIds = data.map((t) => t.sourceId);
      if (source === TRENDING_SOURCES.FEED) {
        const feeds = await this.feedService.getTrendings({ limit: 12, ids: sourceIds }, user, jwToken);
        return feeds.map((f) => ({ ...f, trendingSource: TRENDING_SOURCES.FEED }));
      } if (source === TRENDING_SOURCES.VIDEO) {
        const videos = await this.videoService.getTrendings({ limit: 12, ids: sourceIds }, user);
        return videos.map((f) => ({ ...f, trendingSource: TRENDING_SOURCES.VIDEO }));
      } if (source === TRENDING_SOURCES.GALLERY) {
        const galleries = await this.galleryService.getTrendings({ limit: 12, ids: sourceIds }, user, jwToken);
        return galleries.map((f) => ({ ...f, trendingSource: TRENDING_SOURCES.GALLERY }));
      }
      const products = await this.productService.getTrendings({ limit: 12, ids: sourceIds });
      return products.map((f) => ({ ...f, trendingSource: TRENDING_SOURCES.PRODUCT }));
    }

    const [trendFeeds, trendVideos, trendGalleries, trendProducts] = await Promise.all([
      this.trendingModel.find({ ...query, source: TRENDING_SOURCES.FEED })
        .limit(12)
        .skip(0)
        .sort(sort)
        .lean(),
      this.trendingModel.find({ ...query, source: TRENDING_SOURCES.VIDEO })
        .limit(12)
        .skip(0)
        .sort(sort)
        .lean(),
      this.trendingModel.find({ ...query, source: TRENDING_SOURCES.GALLERY })
        .limit(12)
        .skip(0)
        .sort(sort)
        .lean(),
      this.trendingModel.find({ ...query, source: TRENDING_SOURCES.PRODUCT })
        .limit(12)
        .skip(0)
        .sort(sort)
        .lean()
    ]);
    const [feeds, videos, galleries, products] = await Promise.all([
      this.feedService.getTrendings({ ids: trendFeeds.map((t) => t.sourceId) }, user, jwToken),
      this.videoService.getTrendings({ ids: trendVideos.map((t) => t.sourceId) }, user),
      this.galleryService.getTrendings({ ids: trendGalleries.map((t) => t.sourceId) }, user, jwToken),
      this.productService.getTrendings({ ids: trendProducts.map((t) => t.sourceId) })
    ]);

    const data = flattenDeep([
      feeds.map((f) => ({ ...f, trendingSource: TRENDING_SOURCES.FEED })),
      videos.map((f) => ({ ...f, trendingSource: TRENDING_SOURCES.VIDEO })),
      galleries.map((f) => ({ ...f, trendingSource: TRENDING_SOURCES.GALLERY })),
      products.map((f) => ({ ...f, trendingSource: TRENDING_SOURCES.PRODUCT }))
    ]);
    return data;
  }
}
