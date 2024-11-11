import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class RespondFavoriteDto {
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsBoolean()
  accepted: boolean;
}
