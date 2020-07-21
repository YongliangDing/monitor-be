import { Document } from 'mongoose';

export interface IDLog extends Document {
  readonly _id: string;
  readonly ipAddress: string;
  readonly address: string;
  readonly accessTime: number;
  readonly requestMethod: string;
  readonly requestPath: string;
  readonly protocol: string;
  readonly requestState: string;
  readonly pageSize: string;
  readonly sourcePage: string;
  readonly userAgent: object;
}

export interface IEchartsCommonData {
  xAxisData: string[];
  seriesData: number[][];
}

export interface IPieSeriesData {
  value: number;
  name: string;
}

export interface IEchartsPieData {
  legendData: string[];
  seriesData: IPieSeriesData[];
}

export interface IAggregateResult {
  _id: string;
  total: number;
}

export interface IEchartsNestedPiesData {
  countByName: IAggregateResult[];
  countByVersion: CountByVersion[];
}

interface INameVersion {
  name?: string;
  version?: string;
}

export interface CountByVersion {
  _id: INameVersion;
  total: number;
}

export interface ILog {
  _id: string;
  ipAddress: string;
  address: string;
  accessTime: number;
  requestMethod: string;
  requestPath: string;
  protocol: string;
  requestState: string;
  pageSize: string;
  sourcePage: string;
  userAgent: any;
}

export interface ITable {
  length: number;
  onePage: ILog[];
}

export interface IDateRange {
  startDate?: number,
  endDate?: number,
}

export interface IFormData {
  ipAddress: string;
  requestMethod: string;
  protocol: string;
  requestState: string;
  os: string;
  browser: string;
}
