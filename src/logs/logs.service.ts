import { Model } from 'mongoose';
import { IDLog } from './interfaces/log.interface';
import { Injectable, Inject } from '@nestjs/common';
import { IAggregateResult, CountByVersion, ILog, IFormData } from './datatype';

function finishFindObj(findObj: any, form: IFormData) {
  let keys = Object.keys(form);
  keys = keys.filter(x => !!form[x]);
  keys.forEach(key => {
    if (key === 'os') {
      findObj.$and.push({'userAgent.parsedResult.os.name': form[key]});
    } else if (key === 'browser') {
      findObj.$and.push({'userAgent.parsedResult.browser.name': form[key]});
    } else {
      findObj.$and.push({[key]: form[key]});
    }
  });
}

@Injectable()
export class LogsService {
  constructor(@Inject('LogModelToken') private readonly logModel: Model<IDLog>) { }

  countByDatePv(startDate?: Date, endDate?: Date): Promise<IAggregateResult[]> {
    const aggregateArr: any[] = [
      { $project: { _id: 0, formatDate: { $dateToString: { format: '%Y-%m-%d', timezone: '+08', date: { $toDate: '$accessTime' } } } } },
      { $group: { _id: '$formatDate', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];
    if (startDate && endDate) {
      aggregateArr.unshift({ $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } });
    }
    return this.logModel.aggregate(aggregateArr);
  }

  countByDateUv(startDate?: Date, endDate?: Date): Promise<IAggregateResult[]> {
    const aggregateArr: any[] = [
      { $project: { _id: 0, ipAddress: 1, formatDate: { $dateToString: { format: '%Y-%m-%d', timezone: '+08', date: { $toDate: '$accessTime' } } } } },
      { $group: { _id: { formatDate: '$formatDate', ipAddress: '$ipAddress' } } },
      { $project: { _id: 0, formatDate: '$_id.formatDate', ipAddress: '$_id.ipAddress' } },
      { $group: { _id: '$formatDate', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];
    if (startDate && endDate) {
      aggregateArr.unshift({ $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },);
    }
    return this.logModel.aggregate(aggregateArr);
  }

  countByHour(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },
      { $project: { _id: 0, myHour: { $hour: { timezone: '+08', date: { $toDate: '$accessTime' } } } } },
      { $group: { _id: '$myHour', total: { $sum: 1 } } },
    ]);
  }

  countByState(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },
      { $group: { _id: '$requestState', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByMethod(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },
      { $group: { _id: '$requestMethod', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByOSName(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },
      { $group: { _id: '$userAgent.parsedResult.os.name', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByOSVersion(startDate: Date, endDate: Date): Promise<CountByVersion[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },
      { $group: { _id: { name: '$userAgent.parsedResult.os.name', version: '$userAgent.parsedResult.os.version' }, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  findAll(): Promise<ILog[]> {
    return this.logModel
      .find()
      .exec();
  }

  findOnePage(index: number): Promise<ILog[]> {
    return this.logModel
      .find().skip((index - 1) * 5)
      .limit(5);
  }

  findOnePageByRange(index: number, startDate: Date, endDate: Date, size: number, form: IFormData): Promise<ILog[]> {
    const findObj = {
      $and: [
        { accessTime: { $gte: startDate.getTime() } },
        { accessTime: { $lt: endDate.getTime() } }
      ],
    }

    if (!!form) {
      finishFindObj(findObj, form);
    }

    return this.logModel
      .find(findObj)
      .sort({ accessTime: 1 })
      .skip((index - 1) * size)
      .limit(size);
  }

  getCollectionLength(): Promise<number> {
    return this.logModel
      .find()
      .countDocuments();
  }

  getCollectionLengthByRange(startDate: Date, endDate: Date, form: IFormData): Promise<number> {
    const findObj: any = {
      $and: [
        { accessTime: { $gte: startDate.getTime() } },
        { accessTime: { $lt: endDate.getTime() } }
      ],
    };
    if (!!form) {
      finishFindObj(findObj, form);
    }
      
    return this.logModel
      .find(findObj)
      .countDocuments();
  }

  countByBrowserName(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      // { 'userAgent.parsedResult.os.name': os }] } 
      { $match: { $and: [{ accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } }] } },
      { $group: { _id: '$userAgent.parsedResult.browser.name', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByBrowserName2(startDate: Date, endDate: Date, os: string, version: string): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      {
        $match: {
          $and: [{ accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } },
          { 'userAgent.parsedResult.os.name': os },
          { 'userAgent.parsedResult.os.version': version }],
        },
      },
      { $group: { _id: '$userAgent.parsedResult.browser.name', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  }

  countByBrowserVersion(startDate: Date, endDate: Date): Promise<CountByVersion[]> {
    return this.logModel.aggregate([
      // , { 'userAgent.parsedResult.os.name': os }
      { $match: { $and: [{ accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } }] } },
      { $group: { _id: { name: '$userAgent.parsedResult.browser.name', version: '$userAgent.parsedResult.browser.version' }, total: { $sum: 1 } } },
      { $sort: { '_id.name': 1 } },
    ]);
  }

  countByBrowserVersion2(startDate: Date, endDate: Date, os: string, version: string): Promise<CountByVersion[]> {
    return this.logModel.aggregate([
      {
        $match: {
          $and: [
            { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } },
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
      { $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },
      { $group: { _id: '$ipAddress', total: { $sum: 1 } } },
      { $sort: { total: 1 } },
    ]);
  }

  countBySourcePage(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },
      { $group: { _id: '$sourcePage', total: { $sum: 1 } } },
      { $sort: { total: 1 } },
    ]);
  }

  countByRequestPath(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },
      { $group: { _id: '$requestPath', total: { $sum: 1 } } },
      { $sort: { total: 1 } },
    ]);
  }

  countByAddress(startDate: Date, endDate: Date): Promise<IAggregateResult[]> {
    return this.logModel.aggregate([
      { $match: { accessTime: { $gte: startDate.getTime(), $lt: endDate.getTime() } } },
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
