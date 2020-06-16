export interface IEchartsCommonData {
  xAxisData: string[] | number[];
  seriesData1: number[];
  seriesData2?: number[];
}

export interface IPieSeriesData {
  value: number;
  name: string;
}

export interface IEchartsPieData {
  legendData: string[] | number[];
  seriesData: IPieSeriesData[];
}

export interface IAggregateResult {
  _id: string | number;
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
  accessTime: Date;
  requestMethod: string;
  requestPath: string;
  protocol: string;
  requestState: string;
  pageSize: string;
  sourcePage: string;
  userAgent: object;
}

export interface ITable {
  length: number;
  onePage: ILog[];
}

export interface IDateRange {
  startDate?: number,
  endDate?: number,
}