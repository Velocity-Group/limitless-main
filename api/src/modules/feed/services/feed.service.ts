import {
  Injectable, Inject, forwardRef, HttpException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  EntityNotFoundException, AgendaService,
  QueueEventService, QueueEvent, ForbiddenException, StringHelper
} from 'src/kernel';
import { uniq } from 'lodash';
import { PerformerService } from 'src/modules/performer/services';
import { FileService } from 'src/modules/file/services';
import { ReactionService } from 'src/modules/reaction/services/reaction.service';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { EVENT, STATUS } from 'src/kernel/constants';
import { REACTION } from 'src/modules/reaction/constants';
import { PurchaseItemType, PURCHASE_ITEM_STATUS, PURCHASE_ITEM_TARTGET_TYPE } from 'src/modules/token-transaction/constants';
import { SUBSCRIPTION_STATUS } from 'src/modules/subscription/constants';
import { REF_TYPE } from 'src/modules/file/constants';
import { TokenTransactionSearchService, TokenTransactionService } from 'src/modules/token-transaction/services';
import { UserDto } from 'src/modules/user/dtos';
import { isObjectId } from 'src/kernel/helpers/string.helper';
import * as moment from 'moment';
import { Storage } from 'src/modules/storage/contants';
import { FeedDto, PollDto } from '../dtos';
import { InvalidFeedTypeException, AlreadyVotedException, PollExpiredException } from '../exceptions';
import {
  FEED_SOURCE, FEED_TYPES, POLL_TARGET_SOURCE,
  PERFORMER_FEED_CHANNEL, VOTE_FEED_CHANNEL, SCHEDULE_FEED_AGENDA
} from '../constants';
import { FeedCreatePayload, FeedSearchRequest, PollCreatePayload } from '../payloads';
import { FeedModel, PollModel, VoteModel } from '../models';
import { FEED_PROVIDER, POLL_PROVIDER, VOTE_PROVIDER } from '../providers';

@Injectable()
export class FeedService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => TokenTransactionSearchService))
    private readonly tokenTransactionSearchService: TokenTransactionSearchService,
    @Inject(forwardRef(() => TokenTransactionService))
    private readonly paymentTokenService: TokenTransactionService,
    @Inject(forwardRef(() => ReactionService))
    private readonly reactionService: ReactionService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(POLL_PROVIDER)
    private readonly PollVoteModel: Model<PollModel>,
    @Inject(VOTE_PROVIDER)
    private readonly voteModel: Model<VoteModel>,
    @Inject(FEED_PROVIDER)
    private readonly feedModel: Model<FeedModel>,
    private readonly queueEventService: QueueEventService,
    private readonly agenda: AgendaService
  ) {
    this.defineJobs();
  }

  private async defineJobs() {
    const collection = (this.agenda as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [
          SCHEDULE_FEED_AGENDA
        ]
      }
    });
    // schedule feed
    this.agenda.define(SCHEDULE_FEED_AGENDA, {}, this.scheduleFeed.bind(this));
    this.agenda.schedule('1 hour from now', SCHEDULE_FEED_AGENDA, {});
  }

  private async scheduleFeed(job: any, done: any) {
    try {
      const feeds = await this.feedModel.find({
        isSchedule: true,
        scheduleAt: { $lte: new Date() }
      }).lean();
      await Promise.all(feeds.map((feed) => {
        const v = new FeedDto(feed);
        this.feedModel.updateOne(
          {
            _id: v._id
          },
          {
            isSchedule: false,
            status: STATUS.ACTIVE,
            updatedAt: new Date()
          }
        );
        const oldStatus = feed.status;
        return this.queueEventService.publish(
          new QueueEvent({
            channel: PERFORMER_FEED_CHANNEL,
            eventName: EVENT.UPDATED,
            data: {
              ...v,
              oldStatus
            }
          })
        );
      }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Schedule feed error', e);
    } finally {
      job.remove();
      this.agenda.schedule('1 hour from now', SCHEDULE_FEED_AGENDA, {});
      typeof done === 'function' && done();
    }
  }

  public async findById(id) {
    const data = await this.feedModel.findById(id);
    return data;
  }

  public async findByIds(ids: string[] | ObjectId[]) {
    const data = await this.feedModel.find({ _id: { $in: ids } });
    return data;
  }

  public async handleCommentStat(feedId: string, num = 1) {
    await this.feedModel.updateOne({ _id: feedId }, { $inc: { totalComment: num } });
  }

  private async _validatePayload(payload: FeedCreatePayload) {
    if (!FEED_TYPES.includes(payload.type)) {
      throw new InvalidFeedTypeException();
    }
    // TODO - validate for other
  }

  public async populateFeedData(feeds: any, user: UserDto, jwToken?: string) {
    const performerIds = uniq(
      feeds.map((f) => f.fromSourceId.toString())
    );
    const feedIds = feeds.map((f) => f._id);
    let pollIds = [];
    let fileIds = [];
    feeds.forEach((f) => {
      if (f.fileIds && f.fileIds.length) {
        fileIds = uniq(fileIds.concat(f.fileIds.concat([f?.thumbnailId || null, f?.teaserId || null])));
      }
      if (f.pollIds && f.pollIds.length) {
        pollIds = pollIds.concat(f.pollIds);
      }
    });
    const [performers, files, actions, subscriptions, transactions, polls] = await Promise.all([
      performerIds.length ? this.performerService.findByIds(performerIds) : [],
      fileIds.length ? this.fileService.findByIds(fileIds) : [],
      user && user._id ? this.reactionService.findByQuery({ objectId: { $in: feedIds }, createdBy: user._id }) : [],
      user && user._id ? this.subscriptionService.findSubscriptionList({
        userId: user._id,
        performerId: { $in: performerIds },
        expiredAt: { $gt: new Date() },
        status: SUBSCRIPTION_STATUS.ACTIVE
      }) : [],
      user && user._id ? this.tokenTransactionSearchService.findByQuery({
        sourceId: user._id,
        targetId: { $in: feedIds },
        target: PURCHASE_ITEM_TARTGET_TYPE.FEED,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      }) : [],
      pollIds.length ? this.PollVoteModel.find({ _id: { $in: pollIds } }) : []
    ]);

    return feeds.map((f) => {
      const feed = new FeedDto(f);
      const performer = performers.find((p) => p._id.toString() === f.fromSourceId.toString());
      if (performer) {
        feed.performer = performer.toPublicDetailsResponse();
      }
      const like = actions.find((l) => l.objectId.toString() === f._id.toString() && l.action === REACTION.LIKE);
      feed.isLiked = !!like;
      const bookmarked = actions.find((l) => l.objectId.toString() === f._id.toString() && l.action === REACTION.BOOK_MARK);
      feed.isBookMarked = !!bookmarked;
      const subscribed = subscriptions.find((s) => `${s.performerId}` === `${f.fromSourceId}`);
      feed.isSubscribed = !!subscribed;
      const bought = transactions.find((transaction) => `${transaction.targetId}` === `${f._id}`);
      feed.isBought = !!bought;
      const feedFileStringIds = (f.fileIds || []).map((fileId) => fileId.toString());
      const feedPollStringIds = (f.pollIds || []).map((pollId) => pollId.toString());
      feed.polls = polls.filter((p) => feedPollStringIds.includes(p._id.toString()));
      const feedFiles = files.filter((file) => feedFileStringIds.includes(file._id.toString()));
      const canView = (feed.isSale && feed.isBought) || (!feed.isSale && feed.isSubscribed) || (user && user._id && `${user._id}` === `${f.fromSourceId}`) || (user && user.roles && user.roles.includes('admin'));
      if ((user && user._id && `${user._id}` === `${f.fromSourceId}`) || (user && user.roles && user.roles.includes('admin'))) {
        feed.isSubscribed = true;
        feed.isBought = true;
      }
      if (feedFiles.length) {
        feed.files = feedFiles.map((file) => {
          // track server s3 or local, assign jwtoken if local
          let fileUrl = file.getUrl(canView);
          if (file.server !== Storage.S3) {
            fileUrl = `${fileUrl}?feedId=${feed._id}&token=${jwToken}`;
          }
          return {
            ...file.toResponse(),
            thumbnails: file.getThumbnails(),
            url: fileUrl
          };
        });
      }
      if (feed.thumbnailId) {
        const thumbnail = files.find((file) => file._id.toString() === feed.thumbnailId.toString());
        feed.thumbnail = thumbnail && {
          ...thumbnail.toResponse(),
          thumbnails: thumbnail.getThumbnails(),
          url: thumbnail.getUrl()
        };
      }
      if (feed.teaserId) {
        const teaser = files.find((file) => file._id.toString() === feed.teaserId.toString());
        feed.teaser = teaser && {
          ...teaser,
          thumbnails: teaser.getThumbnails(),
          url: teaser.getUrl()
        };
      }
      return feed;
    });
  }

  public async findOne(id: string, user: UserDto, jwToken: string): Promise<FeedDto> {
    const query = isObjectId(id) ? { _id: id } : { slug: id };
    const feed = await this.feedModel.findOne(query);
    if (!feed) {
      throw new EntityNotFoundException();
    }
    const newFeed = await this.populateFeedData([feed], user, jwToken);
    return new FeedDto(newFeed[0]);
  }

  public async create(payload: FeedCreatePayload, user: UserDto): Promise<any> {
    // TODO - validate with the feed type?
    await this._validatePayload(payload);
    const fromSourceId = user.roles && user.roles.includes('admin') && payload.fromSourceId ? payload.fromSourceId : user._id;
    const performer = await this.performerService.findById(fromSourceId);
    if (!performer) throw new EntityNotFoundException();
    const data = { ...payload } as any;
    data.slug = `${StringHelper.randomString(8, '0123456789')}`;
    const slugCheck = await this.feedModel.countDocuments({
      slug: data.slug
    });
    if (slugCheck) {
      data.slug = `${data.slug}${StringHelper.randomString(8, '0123456789')}`;
    }
    const feed = await this.feedModel.create({
      ...data,
      orientation: performer.sexualOrientation,
      fromSource: 'performer',
      fromSourceId
    } as any);
    if (feed.fileIds && feed.fileIds.length) {
      await Promise.all(feed.fileIds.map((fileId) => this.fileService.addRef((fileId as any), {
        itemId: feed._id,
        itemType: REF_TYPE.FEED
      })));
    }
    feed.teaserId && await this.fileService.addRef((feed.teaserId as any), {
      itemId: feed._id,
      itemType: REF_TYPE.FEED
    });
    feed.thumbnailId && await this.fileService.addRef((feed.thumbnailId as any), {
      itemId: feed._id,
      itemType: REF_TYPE.FEED
    });
    if (feed.status === STATUS.ACTIVE) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_FEED_CHANNEL,
          eventName: EVENT.CREATED,
          data: new FeedDto(feed)
        })
      );
    }
    return feed;
  }

  public async search(req: FeedSearchRequest, user: UserDto, jwToken: string) {
    const query = {
      fromSource: FEED_SOURCE.PERFORMER
    } as any;

    if (!user.roles || !user.roles.includes('admin')) {
      query.fromSourceId = user._id;
    }

    if (user.roles && user.roles.includes('admin') && req.performerId) {
      query.fromSourceId = req.performerId;
    }

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).endOf('day').toDate()
      };
    }

    if (req.orientation) {
      query.orientation = req.orientation;
    }

    if (req.type) {
      query.type = req.type;
    }

    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { text: searchValue }
      ];
    }

    const sort = {
      updatedAt: -1
    };

    const [data, total] = await Promise.all([
      this.feedModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.feedModel.countDocuments(query)
    ]);

    // populate video, photo, etc...
    return {
      data: await this.populateFeedData(data, user, jwToken),
      total
    };
  }

  public async userSearchFeeds(req: FeedSearchRequest, user: UserDto, jwToken: string) {
    const query = {
      fromSource: FEED_SOURCE.PERFORMER,
      status: STATUS.ACTIVE
    } as any;

    if (req.performerId) {
      query.fromSourceId = req.performerId;
    }
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { text: searchValue }
      ];
    }
    if (req.orientation) {
      query.orientation = req.orientation;
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).endOf('day').toDate()
      };
    }
    if (req.ids) {
      query._id = { $in: req.ids };
    }
    const sort = {
      updatedAt: -1
    };
    const [data, total] = await Promise.all([
      this.feedModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.feedModel.countDocuments(query)
    ]);
    // populate video, photo, etc...
    return {
      data: await this.populateFeedData(data, user, jwToken),
      total
    };
  }

  public async searchSubscribedPerformerFeeds(req: FeedSearchRequest, user: UserDto, jwToken: string) {
    const query = {
      fromSource: FEED_SOURCE.PERFORMER,
      status: STATUS.ACTIVE
    } as any;

    const [subscriptions] = await Promise.all([
      user ? this.subscriptionService.findSubscriptionList({
        userId: user._id,
        expiredAt: { $gt: new Date() },
        status: SUBSCRIPTION_STATUS.ACTIVE
      }) : []
    ]);
    const performerIds = subscriptions.map((s) => s.performerId);
    query.fromSourceId = { $in: performerIds };
    if (!user || !performerIds.length || (user && user.roles && user.roles.includes('admin')) || (user && user.isPerformer)) delete query.fromSourceId;
    if (req.q) {
      query.$or = [
        {
          text: { $regex: new RegExp(req.q, 'i') }
        }
      ];
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.orientation) {
      query.orientation = req.orientation;
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).endOf('day').toDate()
      };
    }
    const sort = {
      updatedAt: -1
    };
    const [data, total] = await Promise.all([
      this.feedModel
        .find(query)
        .sort(sort)
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10)),
      this.feedModel.countDocuments(query)
    ]);
    // populate video, photo, etc...
    return {
      data: await this.populateFeedData(data, user, jwToken),
      total
    };
  }

  public async updateFeed(id: string, user: UserDto, payload: FeedCreatePayload): Promise<any> {
    const feed = await this.feedModel.findById(id);
    if (!feed || ((!user.roles || !user.roles.includes('admin')) && feed.fromSourceId.toString() !== user._id.toString())) throw new EntityNotFoundException();
    const data = { ...payload } as any;
    data.updatedAt = new Date();
    if (!feed.slug) {
      data.slug = `post-${StringHelper.randomString(8, '0123456789')}`;
      const slugCheck = await this.feedModel.countDocuments({
        slug: data.slug,
        _id: { $ne: feed._id }
      });
      if (slugCheck) {
        data.slug = `${data.slug}${StringHelper.randomString(8, '0123456789')}`;
      }
    }
    await this.feedModel.updateOne({ _id: id }, data);
    if (payload.fileIds && payload.fileIds.length) {
      const ids = feed.fileIds.map((_id) => _id.toString());
      const Ids = payload.fileIds.filter((_id) => !ids.includes(_id));
      const deleteIds = feed.fileIds.filter((_id) => !payload.fileIds.includes(_id.toString()));
      await Promise.all(Ids.map((fileId) => this.fileService.addRef((fileId as any), {
        itemId: feed._id,
        itemType: REF_TYPE.FEED
      })));
      await Promise.all(deleteIds.map((_id) => this.fileService.remove(_id)));
    }
    if ((feed.thumbnailId && `${feed.thumbnailId}` !== `${data.thumbnailId}`) || (feed.thumbnailId && !data.thumbnailId)) {
      await this.fileService.remove(feed.thumbnailId);
    }
    if ((feed.teaserId && `${feed.teaserId}` !== `${data.teaserId}`) || (feed.teaserId && !data.teaserId)) {
      await this.fileService.remove(feed.teaserId);
    }
    return { updated: true };
  }

  public async deleteFeed(id: string, user: UserDto) {
    if (!isObjectId(id)) throw new EntityNotFoundException();
    const feed = await this.feedModel.findById(id);
    if (!feed) {
      throw new EntityNotFoundException();
    }
    if (user.roles && !user.roles.includes('admin') && `${user._id}` !== `${feed.fromSourceId}`) {
      throw new HttpException('You don\'t have permission to remove this post', 403);
    }
    await feed.remove();
    await Promise.all([
      feed.thumbnailId && this.fileService.remove(feed.thumbnailId),
      feed.teaserId && this.fileService.remove(feed.teaserId)
    ]);
    await Promise.all(feed.fileIds.map((_id) => this.fileService.remove(_id)));
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PERFORMER_FEED_CHANNEL,
        eventName: EVENT.DELETED,
        data: new FeedDto(feed)
      })
    );
    return { success: true };
  }

  public async checkAuth(req: any, user: UserDto) {
    const { query } = req;
    if (!query.feedId) {
      throw new ForbiddenException();
    }
    if (user.roles && user.roles.indexOf('admin') > -1) {
      return true;
    }
    // check type video
    const feed = await this.feedModel.findById(query.feedId);
    if (!feed) throw new EntityNotFoundException();
    if (user._id.toString() === feed.fromSourceId.toString()) {
      return true;
    }
    if (!feed.isSale) {
      // check subscription
      const subscribed = await this.subscriptionService.checkSubscribed(
        feed.fromSourceId,
        user._id
      );
      if (!subscribed) {
        throw new ForbiddenException();
      }
      return true;
    } if (feed.isSale) {
      // check bought
      const bought = await this.paymentTokenService.checkBought(feed, PurchaseItemType.FEED, user);
      if (!bought) {
        throw new ForbiddenException();
      }
      return true;
    }
    throw new ForbiddenException();
  }

  public async createPoll(payload: PollCreatePayload, user: UserDto) {
    const poll = new this.PollVoteModel({
      ...payload,
      createdBy: user.roles && user.roles.includes('admin') && payload.performerId ? payload.performerId : user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await poll.save();
    return new PollDto(poll);
  }

  public async votePollFeed(pollId: string | ObjectId, user: UserDto): Promise<any> {
    const poll = await this.PollVoteModel.findById(pollId);
    if (!poll || !poll.refId) {
      throw new EntityNotFoundException();
    }
    if (new Date(poll.expiredAt) < new Date()) {
      throw new PollExpiredException();
    }
    const vote = await this.voteModel.findOne({
      targetSource: POLL_TARGET_SOURCE.FEED,
      refId: poll.refId,
      fromSourceId: user._id
    });

    if (vote) {
      throw new AlreadyVotedException();
    }

    const newVote = await this.voteModel.create({
      targetSource: POLL_TARGET_SOURCE.FEED,
      targetId: pollId,
      refId: poll.refId,
      fromSource: 'user',
      fromSourceId: user._id
    });
    await this.queueEventService.publish(
      new QueueEvent({
        channel: VOTE_FEED_CHANNEL,
        eventName: EVENT.CREATED,
        data: newVote
      })
    );

    return { voted: true };
  }
}
