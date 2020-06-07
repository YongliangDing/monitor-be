import { Document } from 'mongoose';

export interface Log extends Document {
  readonly _id: string;
  readonly ipAddress: string;
  readonly address: string;
  readonly accessTime: Date;
  readonly requestMethod: string;
  readonly requestPath: string;
  readonly protocol: string;
  readonly requestState: string;
  readonly pageSize: string;
  readonly sourcePage: string;
  readonly userAgent: object;
}
