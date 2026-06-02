import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

import { RegisterDto } from './dto/register.dto';

import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
    });

    return {
      message: 'User registered successfully',
      uuid: user.uuid,
    };
  }
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async generateTokens(user: { uuid: string; email: string }) {
    const payload = {
      sub: user.uuid,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
    };
  }
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    const tokens = await this.generateTokens({
      uuid: user.uuid,
      email: user.email,
    });

    return {
      ...tokens,

      user: {
        uuid: user.uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }
}
