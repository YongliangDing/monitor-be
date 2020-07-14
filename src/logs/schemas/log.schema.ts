import { Schema } from 'mongoose';

export const LogSchema = new Schema({
  _id: String,
  ipAddress: String,
  address: String,
  accessTime: Date,
  requestMethod: String,
  requestPath: String,
  protocol: String,
  requestState: String,
  pageSize: String,
  sourcePage: String,
  userAgent: Object,
});
