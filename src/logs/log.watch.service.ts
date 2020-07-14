import to from 'await-to-js';
import { model } from 'mongoose';
import { getParser } from 'bowser';
import { createHash } from 'crypto';
import { promises as fsPromise } from 'fs';
import { Injectable } from '@nestjs/common';
import { watchFile } from 'fs';
import { LogSchema } from './schemas/log.schema';
import { EventsGateway } from '../events/events.gateway';
import { ILog } from './datatype';

const libqqwry = require('lib-qqwry');
const FILE = '/var/log/nginx/access.log';
const qqwry = libqqwry();
qqwry.speed();
let lineNo = 0;

function array2Object(result: RegExpMatchArray, id: string): ILog {
  const word2No = new Map([
    ['Jan', '01'], ['Feb', '02'], ['Mar', '03'], ['Apr', '04'], ['May', '05'], ['Jun', '06'],
    ['Jul', '07'], ['Aug', '08'], ['Sep', '09'], ['Oct', '10'], ['Nov', '11'], ['Dec', '12']
  ]);
  const provinces = [
    '河南', '河北', '北京', '天津', '山东', '山西', '黑龙江', '吉林', '辽宁', '浙江', '江苏', '上海', '安徽',
    '江西', '湖南', '湖北', '新疆', '云南', '贵州', '福建', '台湾', '宁夏', '西藏', '四川', '重庆', '内蒙古',
    '广西', '海南', '青海', '甘肃', '陕西', '广东', '香港', '澳门'
  ];
  const timePattern = /^(?<date>\d+)\/(?<month>\w+)\/(?<year>\d+)\:(?<time>[\d\:]+)\s(?<diff>\+\d{4})$/;
  const { year, month, date, time, diff } = result.groups.accessTime.match(timePattern).groups;
  const { ipAddress, requestMethod, requestPath, protocol, requestState, pageSize, sourcePage } = result.groups;
  const addressDetail = qqwry.searchIP(ipAddress).Country;
  const address = (addressDetail === '本机地址' || addressDetail === '局域网') ?
    '广州' :
    provinces.find(province => addressDetail.includes(province)) || addressDetail;
  return {
    _id: id,
    ipAddress,
    address,
    accessTime: new Date(`${year}-${word2No.get(month)}-${date}T${time}${diff}`),
    requestMethod,
    requestPath,
    protocol,
    requestState,
    pageSize,
    sourcePage,
    userAgent: getParser(result.groups.userAgent).parse(),
  };
}

async function handleRecords(records: string[]) {
  const LogModel = model('Log', LogSchema, 'logs');
  const pattern = /^(?<ipAddress>[\d\.]+)\s-\s-\s\[(?<accessTime>[^\!]+)\]\s"(?<requestMethod>\w+)\s(?<requestPath>[^\s]+)\s(?<protocol>[\w\/\.]+)"\s(?<requestState>\d+)\s(?<pageSize>\d+)\s"(?<sourcePage>[^\s]+)"\s"(?<userAgent>[^\[]+)"/;
  const toInsertDatas = [];
  records
    .filter(record => !!record)
    .forEach(record => {
      lineNo++;
      const result = record.match(pattern);
      const id = createHash('md5').update(lineNo + record).digest('hex');
      result && toInsertDatas.push(array2Object(result, id));
    });
  const [err] = await to(LogModel.insertMany(toInsertDatas));
  err && console.error(err);
}

async function handleAccessLog() {
  const fileContent = await fsPromise.readFile(FILE, 'utf8');
  const records = fileContent.split('\n');
  handleRecords(records);
};


@Injectable()
export class WatchService {
  constructor(private readonly eventsGateway: EventsGateway) {
    handleAccessLog();
    watchFile(FILE, async (curr, prev) => {
      if (curr.size <= prev.size) {
        return;
      }

      const abuffer = Buffer.alloc(curr.size - prev.size, 'utf8');
      const [fdErr, fd] = await to(fsPromise.open(FILE, 'r'));
      if (fdErr) {
        return console.error('open fail', fdErr);
      }

      const [readBufferErr, { buffer: readBuffer }] = await to(fd.read(abuffer, 0, curr.size - prev.size, prev.size));
      if (readBufferErr) {
        return console.error('read fail', readBufferErr);
      }

      const lines = readBuffer.toString().split('\n');
      await handleRecords(lines);
      this.eventsGateway.server.emit('update-log');
    });
  }
}
