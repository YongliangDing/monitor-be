import * as fs from 'fs';
import { promises as fsPromise } from 'fs';
import * as crypto from 'crypto';
import * as mongoose from 'mongoose';
import * as bowser from 'bowser';
import { LogSchema } from './schemas/log.schema';
import to from 'await-to-js';
import { Injectable } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';
const libqqwry = require('lib-qqwry');

const provinces = ['河南', '河北', '北京', '天津', '山东', '山西', '黑龙江', '吉林', '辽宁', '浙江', '江苏', '上海', '安徽', '江西', '湖南', '湖北',
  '新疆', '云南', '贵州', '福建', '台湾', '宁夏', '西藏', '四川', '重庆', '内蒙古', '广西', '海南', '青海', '甘肃', '陕西', '广东', '香港', '澳门'];
const pattern = /^(?<ipAddress>[\d\.]+)\s-\s-\s\[(?<accessTime>[^\!]+)\]\s"(?<requestMethod>\w+)\s(?<requestPath>[^\s]+)\s(?<protocol>[\w\/\.]+)"\s(?<requestState>\d+)\s(?<pageSize>\d+)\s"(?<sourcePage>[^\s]+)"\s"(?<userAgent>[^\[]+)"/;
const word2No = new Map([['Jan', '01'], ['Feb', '02'], ['Mar', '03'], ['Apr', '04'], ['May', '05'], ['Jun', '06'], ['Jul', '07'], ['Aug', '08'], ['Sep', '09'], ['Oct', '10'], ['Nov', '11'], ['Dec', '12']]);
const FILE = '/var/log/nginx/access.log';
const LogModel = mongoose.model('Log', LogSchema, 'logs');
let lineNo = 0;
const qqwry = libqqwry();
qqwry.speed();



function getId(str: string): string {
  const createHashByMd5 = crypto.createHash('md5');
  createHashByMd5.update(str);
  return createHashByMd5.digest('hex');
}

function array2Object(result: RegExpMatchArray, id: string): object {
  const timePattern = /^(?<date>\d+)\/(?<month>\w+)\/(?<year>\d+)\:(?<time>[\d\:]+)\s(?<diff>\+\d{4})$/;
  const arr = result.groups.accessTime.match(timePattern);
  const accessTime = new Date(`${arr.groups.year}-${word2No.get(arr.groups.month)}-${arr.groups.date}T${arr.groups.time}${arr.groups.diff}`);
  const userAgent = bowser.getParser(result.groups.userAgent).parse();
  const { ipAddress, requestMethod, requestPath, protocol, requestState, pageSize, sourcePage } = result.groups;
  let address = qqwry.searchIP(ipAddress).Country;
  if (address === '本机地址' || address === '局域网') {
    address = '广州';
  } else {
    for (const province of provinces) {
      if (address.includes(province)) {
        address = province;
        break;
      }
    }
  }
  return {
    _id: id,
    ipAddress,
    address,
    accessTime,
    requestMethod,
    requestPath,
    protocol,
    requestState,
    pageSize,
    sourcePage,
    userAgent,
  };
}

async function handleRecords(records: string[]) {
  const dataArr = [];
  records.forEach(record => {
    if (record) {
      lineNo++;
      const id = getId(lineNo + record);
      const result = record.match(pattern);
      result && dataArr.push(array2Object(result, id));
    }
  });
  const [err] = await to(LogModel.insertMany(dataArr));
  err && console.log(err);
}

async function handleAccessLog() {
  const fileContent = await fsPromise.readFile(FILE, 'utf8');
  const records: string[] = fileContent.split('\n');
  handleRecords(records);
};

@Injectable()
export class WatchService { 
  constructor(private eventsGateway: EventsGateway) {
    handleAccessLog();
    fs.watchFile(FILE, (curr, prev) => {
      if (curr.size > prev.size) {
        const abuffer = Buffer.alloc(curr.size - prev.size, 'utf8');
        const fd = fs.openSync(FILE, 'r');
        fs.read(fd, abuffer, 0, (curr.size - prev.size), prev.size, async (err, bytesRead, buffer) => {
          const lines = buffer.toString().split('\n');
          await handleRecords(lines);
          this.eventsGateway.server.emit('update-log');
        });
      }
    });
  }
}

