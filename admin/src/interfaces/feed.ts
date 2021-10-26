import { IPerformer } from './performer';
import { ISearch } from './utils';

export interface IFeed {
    _id: string;
    type: string;
    fromSourceId: string;
    performer: IPerformer;
    fromSource: string;
    title: string;
    text: string;
    fileIds: Array<string>;
    totalLike: number;
    totalComment: number;
    createdAt: Date;
    updatedAt: Date;
    files: any;
    isLiked: boolean;
    isSale: boolean;
    price: number;
    isSubscribed: boolean;
    isBought: boolean;
    polls: any[];
    pollIds: string[];
    pollExpiredAt: Date;
    isBookMarked: boolean;
    thumbnail: {
        url: string;
        thumbnails: string[]
    };
    teaser: {
        url: string;
        thumbnails: string[]
    };
    isSchedule: boolean;
    scheduleAt: Date;
    status: string;
    teaserId: string;
    thumbnailId: string;
}

export interface IFeedSearch extends ISearch {
    q: string;
    sort: string;
    sortBy: string;
}
