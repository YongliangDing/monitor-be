import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { IAggregateResult, CountByVersion, ILog } from './datatype';

@Injectable()
export class LogsService {
  constructor(@Inject('LogModelToken') private readonly logModel: Model<ILog>) { }

  firstDate() {
    return this.logModel.aggregate([
      { $project: { _id: 0, accessTime: 1 } },
      { $sort: { accessTime: 1 } },
    ]).limit(1);
  }

  countByDatePv(startDate?: Date, endDate?: Date): Promise<IAggregateResult[]> {
    const aggregateArr: any[] = [
      { $project: { _id: 0, formatDate: { $dateToString: { format: '%Y-%m-%d', timezone: '+08', date: '$accessTime' } } } },
      { $group: { _id: '$formatDate', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];
    if (startDate && endDate) {
      aggregateArr.unshift({ $match: { accessTime: { $gte: startDate, $lt: endDate } } });
    }
    return this.logModel.aggregate(aggregateArr);
  }

  countByDateUv(startDate?: Date, endDate?: Date): Promise<IAggregateResult[]> {
    const aggregateArr: any[] = [
      { $project: { _id: 0, ipAddress: 1, formatDate: { $dateToString: { format: '%Y-%m-%d', timezone: '+08', date: '$accessTime' } } } },
      { $group: { _id: { formatDate: '$formatDate', ipAddress: '$ipAddress' } } },
      { $project: { _id: 0, formatDate: '$_id.formatDate', ipAddress: '$_id.ipAddress' } },
      { $group: { _id: '$formatDate', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];
    if (startDate && endDate) {
      aggregateArr.unshift({ $match: { accessTime: { $gte: startDate, $lt: endDate } } },);
    }
    return this.logModel.aggregate(aggregateArr);
  }

  countByHour(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate, $lt: endDate } } },
      { $project: { _id: 0, myHour: { $hour: { timezone: '+08', date: '$accessTime' } } } },
      { $group: { _id: '$myHour', total: { $sum: 1 } } },
    ]);
  }

  countByState(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$requestState', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByMethod(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$requestMethod', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByOSName(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$userAgent.parsedResult.os.name', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByOSVersion(startDate: Date, endDate: Date): Promise<CountByVersion[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: { name: '$userAgent.parsedResult.os.name', version: '$userAgent.parsedResult.os.version' }, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  findAll(): Promise<ILog[]> {
    return this.logModel.find().exec();
  }

  findOnePage(index): Promise<ILog[]> {
    return this.logModel.find().skip((index - 1) * 5).limit(5);
  }

  findOnePageByRange(index, startDate: Date, endDate: Date, state): Promise<ILog[]> {
    if (!state) {
      return this.logModel.find({
        $and: [{ accessTime: { $gte: startDate } }, { accessTime: { $lt: endDate } }],
      }).sort({ accessTime: 1 }).skip((index - 1) * 5).limit(5);
    } else {
      return this.logModel.find({
        $and: [{ accessTime: { $gte: startDate } }, { accessTime: { $lt: endDate } }, { requestState: state }],
      }).sort({ accessTime: 1 }).skip((index - 1) * 5).limit(5);
    }
  }

  getCollectionLength(): Promise<number> {
    return this.logModel.find().countDocuments();
  }

  getCollectionLengthByRange(startDate: Date, endDate: Date, state): Promise<number> {
    if (!state) {
      return this.logModel.find({
        $and: [{ accessTime: { $gte: startDate } }, { accessTime: { $lt: endDate } }],
      }).countDocuments();
    } else {
      return this.logModel.find({
        $and: [{ accessTime: { $gte: startDate } }, { accessTime: { $lt: endDate } }, { requestState: state }],
      }).countDocuments();
    }
  }

  countByBrowserName(startDate: Date, endDate: Date, os: string): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { $and: [{ accessTime: { $gte: startDate, $lt: endDate } }, { 'userAgent.parsedResult.os.name': os }] } },
      { $group: { _id: '$userAgent.parsedResult.browser.name', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByBrowserName2(startDate: Date, endDate: Date, os: string, version: string): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      {
        $match: {
          $and: [{ accessTime: { $gte: startDate, $lt: endDate } },
          { 'userAgent.parsedResult.os.name': os },
          { 'userAgent.parsedResult.os.version': version }],
        },
      },
      { $group: { _id: '$userAgent.parsedResult.browser.name', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByBrowserVersion(startDate: Date, endDate: Date, os: string): Promise<CountByVersion[]> {
    return this.logModel.aggregate([
      { $match: { $and: [{ accessTime: { $gte: startDate, $lt: endDate } }, { 'userAgent.parsedResult.os.name': os }] } },
      { $group: { _id: { name: '$userAgent.parsedResult.browser.name', version: '$userAgent.parsedResult.browser.version' }, total: { $sum: 1 } } },
      { $sort: { '_id.name': 1 } },
    ]);
  }

  countByBrowserVersion2(startDate: Date, endDate: Date, os: string, version: string): Promise<CountByVersion[]> {
    return this.logModel.aggregate([
      {
        $match: {
          $and: [
            { accessTime: { $gte: startDate, $lt: endDate } },
            { 'userAgent.parsedResult.os.name': os },
            { 'userAgent.parsedResult.os.version': version },
          ],
        },
      },
      { $group: { _id: { name: '$userAgent.parsedResult.browser.name', version: '$userAgent.parsedResult.browser.version' }, total: { $sum: 1 } } },
      { $sort: { '_id.name': 1 } },
    ]);
  }
  countByUser(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$ipAddress', total: { $sum: 1 } } },
      { $sort: { total: 1 } },
    ]);
  }

  countBySourcePage(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$sourcePage', total: { $sum: 1 } } },
      { $sort: { total: 1 } },
    ]);
  }

  countByRequestPath(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$requestPath', total: { $sum: 1 } } },
      { $sort: { total: 1 } },
    ]);
  }

  countByAddress(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$address', total: { $sum: 1 } } },
      { $sort: { total: 1 } },
    ]);
  }

}

// '2018-11-21T00:00:00+08:00'
// '2018-11-22T00:00:00+08:00'

// db.logs.find({
//   $and: [
//     { accessTime: { $gte: ISODate('2018-11-21T00:00:00+08:00') } }, { accessTime: { $lt: ISODate('2018-11-22T00:00:00+08:00') } },
//   ],
// })
