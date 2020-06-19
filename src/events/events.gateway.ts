import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway(3000)
@Injectable()
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('update-log')
  findAll(@MessageBody() data: string): string {
    return data;
  }
}