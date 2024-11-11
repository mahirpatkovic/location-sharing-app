import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { NotFoundException } from '@nestjs/common';
import { UserLocationDto } from './dto/user-location.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly userService: UserService) {}

  async handleConnection() {}

  async handleDisconnect() {}

  @SubscribeMessage('connectUser')
  handleUserConnect(client: Socket, userId: string) {
    client.join(userId);
    console.log(`User with ID ${userId} connected and joined room ${userId}`);
  }

  @SubscribeMessage('shareLocation')
  async handleShareLocation(
    client: Socket,
    payload: UserLocationDto,
  ): Promise<void | NotFoundException> {
    const { userId, latitude, longitude } = payload;
    console.log(payload);
    const user: User = await this.userService.updateLocation(
      userId,
      longitude,
      latitude,
    );

    if (!user) return new NotFoundException('User cannot be found');

    const favoriteUsers: User[] =
      await this.userService.getUserFavorites(userId);

    console.log(favoriteUsers);

    for (const favUser of favoriteUsers) {
      this.server.to(favUser._id.toString()).emit('favoriteLocationUpdate', {
        userId: user._id,
        username: user.username,
        latitude: user.latitude,
        longitude: user.longitude,
      });
    }

    console.log(`Location update sent to favorites of user ${userId}`);
  }

  @SubscribeMessage('join')
  async handleJoinRoom(client: Socket, userId: string) {
    client.join(userId);
    console.log(`User ${userId} joined room: ${userId}`);
  }

  @SubscribeMessage('sendFavoriteRequest')
  async handleSendFavoriteRequest(
    client: Socket,
    payload: { senderId: string; targetId: string },
  ) {
    const { senderId, targetId } = payload;

    await this.userService.sendFavoriteRequest(senderId, targetId);
    this.server.to(targetId).emit('favoriteRequest', { senderId });
  }
}
