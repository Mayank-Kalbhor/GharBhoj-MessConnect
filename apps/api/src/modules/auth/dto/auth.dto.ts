import { IsNotEmpty, IsString, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { UserRole } from '@messconnect/shared-types';

export class VerifyAuthDto {
  @IsNotEmpty()
  @IsString()
  firebaseIdToken: string;
}

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  firebaseIdToken: string;

  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;
}
