export class CreateLogDto {
  // tslint:disable-next-line:variable-name
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
