import { LogsService } from './logs.service';
import { Controller, Get, Query } from '@nestjs/common';
import { IEchartsNestedPiesData, Table, IEchartsCommonData, IEchartsPieData, IAggregateResult } from './datatype';
import to from 'await-to-js';

@Controller()
export class LogsController {
  constructor(private readonly logsService: LogsService) { }

  @Get('/count/date')
  async handleBar(@Query() query): Promise<IEchartsCommonData> {
    let startDate: Date;
    let endDate: Date;
    let pvPromise: Promise<IAggregateResult[]>;
    let uvPromise: Promise<IAggregateResult[]>;
    if (query.startDate && query.endDate) {
      startDate = new Date(+query.startDate);
      endDate = new Date(+query.endDate);
      pvPromise = this.logsService.countBySelectedDatesPv(startDate, endDate);
      uvPromise = this.logsService.countBySelectedDatesUv(startDate, endDate);
    } else {
      pvPromise = this.logsService.countByDatePv();
      uvPromise = this.logsService.countByDateUv();
    }
    const [err, arr] = await to(Promise.all([pvPromise, uvPromise]));
    if (err) {
      console.error(err);
      return;
    }
    const xAxisData: string[] = [];
    const seriesData1: number[] = [];
    const seriesData2: number[] = [];
    arr[0].forEach(ele => {
      xAxisData.push(ele._id + '');
      seriesData1.push(ele.total);
    });
    arr[1].forEach(ele => seriesData2.push(ele.total));
    return { xAxisData, seriesData1, seriesData2 };
  }

  @Get('/first-date')
  async handlefirstDate(@Query() query) {
    return await this.logsService.firstDate();
  }

  @Get('/count/map')
  async handleAddress(@Query() query): Promise<IAggregateResult> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate
      ? new Date(+query.endDate)
      : new Date(startDate.getTime() + 86400000);
    return await this.logsService.countByAddress(startDate, endDate);
  }

  @Get('/count/hour')
  async handleLine(@Query() query): Promise<IEchartsCommonData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate
      ? new Date(+query.endDate)
      : new Date(startDate.getTime() + 86400000);

    const logCount = await this.logsService.countByHour(startDate, endDate);
    logCount.sort((a, b) => (+a._id) - (+b._id));
    const result = {
      xAxisData: [],
      seriesData1: [],
    };
    logCount.forEach(o => {
      result.xAxisData.push(o._id);
      result.seriesData1.push(o.total);
    });
    let i = 0;
    while (i < 24) {
      if (i !== result.xAxisData[i]) {
        result.xAxisData.splice(i, 0, i);
        result.seriesData1.splice(i, 0, 0);
      } else {
        i++;
      }
    }
    return result;
  }

  @Get('/count/os')
  async handleINameVersion(@Query() query): Promise<IEchartsNestedPiesData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate
      ? new Date(+query.endDate)
      : new Date(startDate.getTime() + 86400000);
    const countByNamePromise = this.logsService.countByOSName(startDate, endDate);
    const countByVersionPromise = this.logsService.countByOSVersion(startDate, endDate);
    const [err, arr] = await to(Promise.all([countByNamePromise, countByVersionPromise]));
    if (err) {
      console.error(err);
      return;
    }
    return {
      countByName: arr[0],
      countByVersion: arr[1],
    };
  }

  @Get('/count/browser')
  async handlePieBrowser(@Query() query): Promise<IEchartsNestedPiesData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate
      ? new Date(+query.endDate)
      : new Date(startDate.getTime() + 86400000);
    let countByNamePromise: Promise<IAggregateResult[]>;
    let countByVersion;
    let countByName;

    if (/\s/.test(query.os)) {
      const osPattern = /(?<name>[A-Za-z]+)\s+(?<version>[\w\s\.]+)/;
      const { name, version } = query.os.match(osPattern).groups;
      countByNamePromise = this.logsService.countByBrowserName2(startDate, endDate, name, version);
      countByVersion = await this.logsService.countByBrowserVersion2(startDate, endDate, name, version);
      countByName = await countByNamePromise;
    } else {
      countByNamePromise = this.logsService.countByBrowserName(startDate, endDate, query.os);
      countByVersion = await this.logsService.countByBrowserVersion(startDate, endDate, query.os);
      countByName = await countByNamePromise;
    }
    return {
      countByName,
      countByVersion,
    };
  }

  @Get('/detail')
  async handleTable(@Query() query): Promise<Table> {
    const startDate = new Date(+query.startDate);
    const endDate = new Date(+query.endDate);
    const lengthPromise = this.logsService.getCollectionLengthByRange(startDate, endDate, query.state);
    const length = await lengthPromise;
    const onePage = await this.logsService.findOnePageByRange(query.pageIndex, startDate, endDate, query.state);
    return {
      length,
      onePage,
    };
  }

  @Get('/count/state')
  async handleState(@Query() query): Promise<IEchartsPieData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate
      ? new Date(+query.endDate)
      : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByState(startDate, endDate);
    const result = {
      legendData: [],
      seriesData: [],
    };
    logCount.forEach(o => {
      result.legendData.push(o._id);
      result.seriesData.push({
        value: o.total,
        name: o._id,
      });
    });
    return result;
  }

  @Get('/reqandres/method')
  async handleMethod(@Query() query) {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate
      ? new Date(+query.endDate)
      : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByMethod(startDate, endDate);
    const result = {
      legendData: [],
      seriesData: [],
    };
    logCount.forEach(o => {
      result.legendData.push(o._id);
      result.seriesData.push(o.total);
    });
    return result;
  }

  @Get('/ranking/user')
  async handleUser(@Query() query) {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate
      ? new Date(+query.endDate)
      : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByUser(startDate, endDate);
    const xAxisData = [];
    const seriesData1 = [];
    logCount.forEach(o => {
      xAxisData.push(o._id);
      seriesData1.push(o.total);
    });
    return {
      xAxisData,
      seriesData1,
    };
  }

  @Get('/ranking/source-page')
  async handleSourcePage(@Query() query) {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate
      ? new Date(+query.endDate)
      : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countBySourcePage(startDate, endDate);
    const xAxisData = [];
    const seriesData1 = [];
    logCount.forEach(o => {
      xAxisData.push(o._id);
      seriesData1.push(o.total);
    });
    return {
      xAxisData,
      seriesData1,
    };
  }

  @Get('/ranking/request-path')
  async handleRequestPath(@Query() query) {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate
      ? new Date(+query.endDate)
      : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByRequestPath(startDate, endDate);
    const xAxisData = [];
    const seriesData1 = [];
    logCount.forEach(o => {
      xAxisData.push(o._id);
      seriesData1.push(o.total);
    });
    return {
      xAxisData,
      seriesData1,
    };
  }

}
