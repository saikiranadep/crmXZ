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
import type { Request } from 'express';
import { AUTH_MESSAGES } from '../../common/constants/messages';
import { AppLoggerService } from 'src/common/logger/app-logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: AppLoggerService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException(AUTH_MESSAGES.EMAIL_EXISTS);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
    });

    return {
      message: AUTH_MESSAGES.USER_REGISTER_SUCCESS,
      uuid: user.uuid,
    };
  }
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    return user;
  }

  private async generateTokens(user: {
    uuid: string;
    email: string;
    sessionUuid: string;
  }) {
    const payload = {
      uuid: user.uuid,
      email: user.email,
      sessionUuid: user.sessionUuid,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
    };
  }
  async login(dto: LoginDto, req: Request) {
    const user = await this.validateUser(dto.email, dto.password);
    /* Create Session log after validate user */
    const userSession = await this.usersService.createSession({
      userId: user.id,
      ipAddress: req.ip ?? req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    // console.log('USERSESSION CREATE', userSession);
    this.logger.log(
      `User logged in: ${userSession.sessionUuid}`,
      'AuthService',
    );
    /*  Generate JWT token  */
    const tokens = await this.generateTokens({
      uuid: user.uuid,
      email: user.email,
      sessionUuid: userSession.sessionUuid,
    });

    return {
      ...tokens,
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      user: {
        uuid: user.uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  /* Function to validate logout from active session */
  async logout(sessionUuid: string) {
    await this.usersService.logoutSession(sessionUuid);

    this.logger.log(`User logged out: ${sessionUuid}`, AuthService.name);

    return {
      message: AUTH_MESSAGES.LOGOUT_SUCCESS,
    };
  }
}
