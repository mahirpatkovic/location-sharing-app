import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async searchUsers(username: string): Promise<User[]> {
    return this.userModel
      .find({
        username: { $regex: new RegExp(username, 'i') },
      })
      .exec();
  }

  async sendFavoriteRequest(senderId: string, targetId: string): Promise<void> {
    const updateResult = await this.userModel.findByIdAndUpdate(
      targetId,
      {
        $addToSet: { pendingRequests: senderId },
      },
      { new: true },
    );

    if (!updateResult) {
      throw new Error('Target user not found');
    }
  }

  async respondToFavoriteRequest(
    senderId: string,
    targetId: string,
    accepted: boolean,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(senderId, {
      $pull: { pendingRequests: targetId },
    });

    if (accepted) {
      await this.userModel.findByIdAndUpdate(senderId, {
        $addToSet: { favorites: targetId },
      });

      await this.userModel.findByIdAndUpdate(targetId, {
        $addToSet: { favorites: senderId },
      });
    }
  }

  async updateLocation(
    userId: string,
    longitude: number,
    latitude: number,
  ): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { latitude, longitude },
      { new: true },
    );
  }

  async getUserFavorites(userId: string): Promise<User[]> {
    return await this.userModel.find({ favorites: { $in: [userId] } }).exec();
  }

  async getPendingFavoriteRequests(userId: string): Promise<User[]> {
    const user = await this.userModel
      .findById(userId)
      .populate<{ pendingRequests: User[] }>('pendingRequests');

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.pendingRequests;
  }
}
