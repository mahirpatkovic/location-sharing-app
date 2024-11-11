import {
  Controller,
  Post,
  Body,
  Param,
  BadRequestException,
  Get,
  Query,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { RespondFavoriteDto } from './dto/respond-favorite.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.createUser(createUserDto);
  }

  @Get('search')
  async searchUsers(@Query('username') username: string): Promise<User[]> {
    if (!username) {
      throw new BadRequestException('Username query parameter is required.');
    }

    return this.userService.searchUsers(username);
  }

  @Get('/favorites/:id')
  async getUserFavorites(@Param('id') id: string): Promise<User[]> {
    return this.userService.getUserFavorites(id);
  }

  @Get('/favorites/requests/:id')
  async getPendingRequests(@Param('id') id: string): Promise<User[]> {
    return this.userService.getPendingFavoriteRequests(id);
  }

  @Post('/favorites/requests')
  async addFavorite(@Body() addFavoriteDto: AddFavoriteDto) {
    const { senderId, targetId } = addFavoriteDto;
    if (senderId === targetId) {
      throw new BadRequestException("You can't add yourself as a favorite.");
    }

    return this.userService.sendFavoriteRequest(senderId, targetId);
  }

  @Patch('/favorites/requests/respond')
  async respondFavorite(
    @Body() respondFavoriteDto: RespondFavoriteDto,
  ): Promise<void> {
    const { senderId, targetId, accepted } = respondFavoriteDto;

    if (senderId === targetId) {
      throw new BadRequestException("You can't respond to yourself.");
    }

    return this.userService.respondToFavoriteRequest(
      senderId,
      targetId,
      accepted,
    );
  }
}
