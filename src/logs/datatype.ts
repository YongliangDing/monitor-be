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

interface NameVersion {
  name?: string;
  version?: string;
}

export interface CountByVersion {
  _id: NameVersion;
  total: number;
}

export interface IEchartsNestedPiesData {
  countByName: IAggregateResult[];
  countByVersion: CountByVersion[];
}

export interface PieBrowser {
  countByBrowserName: IAggregateResult[];
  countByBrowserVersion: CountByVersion[];
}

export interface Log {
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

export interface Table {
  length: number;
  onePage: Log[];
}
