import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ToggleDto {
  @IsBoolean()
  completed: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
