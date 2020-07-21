import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import to from 'await-to-js';
import { CountByVersion, IAggregateResult, IDateRange, IEchartsCommonData, IEchartsNestedPiesData, IEchartsPieData, ITable } from './interfaces/log.interface';
import { WatchService } from './log.watch.service';
import { LogsService } from './logs.service';

@Controller()
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
    private readonly watchService: WatchService
  ) { }

  @Get('/count/date')
  async handleDateCount(@Query() query: IDateRange): Promise<IEchartsCommonData> {
    const hasDateRange = (query.startDate && query.endDate) ? true : false;
    const startDate = hasDateRange ? new Date(+query.startDate) : null;
    const endDate = hasDateRange ? new Date(+query.endDate) : null;
    const [err, [pv, uv]] = await to(Promise.all([
      this.logsService.countByDatePv(startDate, endDate),
      this.logsService.countByDateUv(startDate, endDate)
    ]));
    if (err) {
      console.error(err);
      return;
    }
    const xAxisData = pv.map(o => o._id);
    const seriesData = [
      pv.map(o => o.total),
      uv.map(o => o.total)
    ];
    return { xAxisData, seriesData };
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
    const xAxisData = logCount.map(o => o._id);
    const seriesData1 = logCount.map(o => o.total);
    let i = 0;
    while (i < 24) {
      if (i !== +xAxisData[i]) {
        xAxisData.splice(i, 0, i + '');
        seriesData1.splice(i, 0, 0);
      } else {
        i++;
      }
    }
    const seriesData = [seriesData1];
    return { xAxisData, seriesData };
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
    const countByNamePromise: Promise<IAggregateResult[]> = this.logsService.countByBrowserName(startDate, endDate);
    const countByVersionPromise: Promise<CountByVersion[]> = this.logsService.countByBrowserVersion(startDate, endDate);
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

  @Get('/count/state')
  async handleStateCount(@Query() query: IDateRange): Promise<IEchartsPieData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByState(startDate, endDate);
    const legendData = logCount.map(o => o._id);
    const seriesData = logCount.map(o => ({ value: o.total, name: o._id }));
    return { legendData, seriesData };
  }

  @Get('/count/method')
  async handleMethodCount(@Query() query: IDateRange): Promise<IEchartsPieData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByMethod(startDate, endDate);
    const legendData = logCount.map(o => o._id);
    const seriesData = logCount.map(o => ({ value: o.total, name: o._id }));
    return { legendData, seriesData };
  }

  @Get('/ranking/user')
  async handleUserRank(@Query() query: IDateRange): Promise<IEchartsCommonData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByUser(startDate, endDate);
    const xAxisData = logCount.map(o => o._id);
    const seriesData1 = logCount.map(o => o.total);
    const seriesData = [seriesData1];
    return { xAxisData, seriesData };
  }

  @Get('/ranking/source-page')
  async handleSourcePageRank(@Query() query: IDateRange): Promise<IEchartsCommonData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countBySourcePage(startDate, endDate);
    const xAxisData = logCount.map(o => o._id);
    const seriesData1 = logCount.map(o => o.total);
    const seriesData = [seriesData1];
    return { xAxisData, seriesData };
  }

  @Get('/ranking/request-path')
  async handleRequestPathRank(@Query() query: IDateRange): Promise<IEchartsCommonData> {
    const startDate = new Date(+query.startDate);
    const endDate = query.endDate ? new Date(+query.endDate) : new Date(startDate.getTime() + 86400000);
    const logCount = await this.logsService.countByRequestPath(startDate, endDate);
    const xAxisData = logCount.map(o => o._id);
    const seriesData1 = logCount.map(o => o.total);
    const seriesData = [seriesData1];
    return { xAxisData, seriesData };
  }

  @Post('/detail')
  async handleTable(@Body() body): Promise<ITable> {
    const startDate = new Date(+body.startDate);
    const endDate = new Date(+body.endDate);
    const [err, [length, onePage]] = await to(Promise.all([
      this.logsService.getCollectionLengthByRange(startDate, endDate, body.formData),
      this.logsService.findOnePageByRange(body.pageIndex, startDate, endDate, +body.size, body.formData)
    ]));
    if (err) {
      console.log(err);
      return;
    }
    return { length, onePage };
  }

  @Get('/statistics/today')
  async handleToday() {
    const today = new Date();
    return (await this.logsService.countByDatePv(
      new Date(today.setHours(0, 0, 0)),
      new Date(today.setHours(23, 59, 59))
    ))[0].total;
  }

  @Get('/statistics/history')
  async handleHistory() {
    return await this.logsService.getCollectionLength();
  }
}
