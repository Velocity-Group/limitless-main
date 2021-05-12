export interface IGift {
  _id: string;
  title: string;
  price: number;
  status: string;
  description: string;
  photo: { url: string; thumbnails: string[] };
}

export interface IGiftCreate {
  title: string;
  price: number;
  status: string;
  description: string;
}

export interface IGiftUpdate {
  _id: string;
  title?: string;
  price?: number;
  status?: string;
  description?: string;
  photo?: { url: string; thumbnails: string[] };
}
