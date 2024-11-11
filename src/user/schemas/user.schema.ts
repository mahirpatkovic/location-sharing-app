import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  favorites: string[];

  @Prop({ type: Number })
  latitude: number;

  @Prop({ type: Number })
  longitude: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  pendingRequests: string[];

  @Prop({ type: Boolean, default: false })
  shareLocation: boolean;
}

export const UserSchema: MongooseSchema<User> =
  SchemaFactory.createForClass(User);
