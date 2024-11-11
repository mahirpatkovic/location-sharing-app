import { IsString, IsNotEmpty } from 'class-validator';

export class AddFavoriteDto {
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;
}
