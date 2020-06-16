import { LogsService } from './logs.service';
import { Controller, Get, Query } from '@nestjs/common';
import { IEchartsNestedPiesData, IEchartsCommonData, IEchartsPieData, IAggregateResult, ITable, IDateRange, CountByVersion } from './datatype';
import to from 'await-to-js';

@Controller()
export class LogsController {
  constructor(private readonly logsService: LogsService) { }

  @Get('/count/date')
  async handleDateCount(@Query() query: IDateRange): Promise<IEchartsCommonData> {
    const hasDateRange = (query.startDate && query.endDate) ? true : false;
    const startDate = hasDateRange ? new Date(+query.startDate) : null;
    const endDate = hasDateRange ? new Date(+query.endDate) : null;
    const [err, arr] = await to(Promise.all([
      this.logsService.countByDatePv(startDate, endDate),
      this.logsService.countByDateUv(startDate, endDate)
    ]));
    if (err) {
      console.error(err);
      return;
    }
    const xAxisData = [];
    const seriesData1 = [];
    const seriesData2 = [];
    arr[0].forEach(ele => {
      xAxisData.push(ele._id);
      seriesData1.push(ele.total);
    });
    arr[1].forEach(ele => seriesData2.push(ele.total));
    return { xAxisData, seriesData1, seriesData2 };
  }

  @Get('/first-date')
  async handlefirstDate() {
    return await this.logsService.firstDate();
  }

  @Get('/count/map')
  async handleAddressCount(@Query() query: IDateRange): Promise<IAggregateResult[]> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    return await this.logsService.countByAddress(startDate, endDate);
  }

  @Get('/count/hour')
  async handleHourCount(@Query() query: IDateRange): Promise<IEchartsCommonData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByHour(startDate, endDate);
    logCount.sort((a, b) => (+a._id) - (+b._id));
    const xAxisData = [];
    const seriesData1 = [];
    logCount.forEach(o => {
      xAxisData.push(o._id);
      seriesData1.push(o.total);
    });
    let i = 0;
    while (i < 24) {
      if (i !== xAxisData[i]) {
        xAxisData.splice(i, 0, i);
        seriesData1.splice(i, 0, 0);
      } else {
        i++;
      }
    }
    return { xAxisData, seriesData1 };
  }

  @Get('/count/os')
  async handleINameVersion(@Query() query: IDateRange): Promise<IEchartsNestedPiesData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const [err, [countByName, countByVersion]] = await to(Promise.all([
      this.logsService.countByOSName(startDate, endDate),
      this.logsService.countByOSVersion(startDate, endDate)
    ]));
    if (err) {
      console.error(err);
      return;
    }
    return { countByName, countByVersion };
  }

  @Get('/count/browser')
  async handlePieBrowser(@Query() query): Promise<IEchartsNestedPiesData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    let countByNamePromise: Promise<IAggregateResult[]>;
    let countByVersionPromise: Promise<CountByVersion[]>;

    if (/\s/.test(query.os)) {
      const osPattern = /(?<name>[A-Za-z]+)\s+(?<version>[\w\s\.]+)/;
      const { name, version } = query.os.match(osPattern).groups;
      countByNamePromise = this.logsService.countByBrowserName2(startDate, endDate, name, version);
      countByVersionPromise =  this.logsService.countByBrowserVersion2(startDate, endDate, name, version);
    } else {
      countByNamePromise = this.logsService.countByBrowserName(startDate, endDate, query.os);
      countByVersionPromise = this.logsService.countByBrowserVersion(startDate, endDate, query.os);
    }

    const [err, [countByName, countByVersion]] = await to(Promise.all([
      countByNamePromise,
      countByVersionPromise
    ]));
    if (err) {
      console.error(err);
      return;
    }
    return { countByName, countByVersion };
  }

  @Get('/detail')
  async handleTable(@Query() query): Promise<ITable> {
    const startDate = new Date(+query.startDate);
    const endDate = new Date(+query.endDate);
    const lengthPromise = this.logsService.getCollectionLengthByRange(startDate, endDate, query.state);
    const length = await lengthPromise;
    const onePage = await this.logsService.findOnePageByRange(query.pageIndex, startDate, endDate, query.state);
    return { length, onePage };
  }

  @Get('/count/state')
  async handleStateCount(@Query() query: IDateRange): Promise<IEchartsPieData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByState(startDate, endDate);
    const legendData =[];
    const seriesData = [];
    logCount.forEach(o => {
      legendData.push(o._id);
      seriesData.push({ value: o.total, name: o._id });
    });
    return { legendData, seriesData };
  }

  @Get('/count/method')
  async handleMethodCount(@Query() query: IDateRange): Promise<IEchartsPieData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByMethod(startDate, endDate);
    const legendData = [];
    const seriesData = [];
    logCount.forEach(o => {
      legendData.push(o._id);
      seriesData.push(o.total);
    });
    return { legendData, seriesData };
  }

  @Get('/ranking/user')
  async handleUserRank(@Query() query: IDateRange): Promise<IEchartsCommonData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByUser(startDate, endDate);
    const xAxisData = [];
    const seriesData1 = [];
    logCount.forEach(o => {
      xAxisData.push(o._id);
      seriesData1.push(o.total);
    });
    return { xAxisData, seriesData1 };
  }

  @Get('/ranking/source-page')
  async handleSourcePageRank(@Query() query: IDateRange): Promise<IEchartsCommonData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countBySourcePage(startDate, endDate);
    const xAxisData = [];
    const seriesData1 = [];
    logCount.forEach(o => {
      xAxisData.push(o._id);
      seriesData1.push(o.total);
    });
    return { xAxisData, seriesData1 };
  }

  @Get('/ranking/request-path')
  async handleRequestPathRank(@Query() query: IDateRange): Promise<IEchartsCommonData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByRequestPath(startDate, endDate);
    const xAxisData = [];
    const seriesData1 = [];
    logCount.forEach(o => {
      xAxisData.push(o._id);
      seriesData1.push(o.total);
    });
    return { xAxisData, seriesData1 };
  }

}
