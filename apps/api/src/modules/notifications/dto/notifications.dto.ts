import { IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  @IsNotEmpty()
  @IsBoolean()
  isRead: boolean;
}
