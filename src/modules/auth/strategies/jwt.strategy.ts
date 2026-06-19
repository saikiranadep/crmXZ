import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

import { UsersService } from '../../users/users.service';

import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { AUTH_MESSAGES } from 'src/common/constants/messages';
import { AppLoggerService } from 'src/common/logger/app-logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly logger: AppLoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
    this.logger.log('JWT Startegy Loaded', JwtStrategy.name);
  }
  /*
    Validate JWT request with session and user 
  */
  async validate(payload: JwtPayload) {
    // this.logger.debug(JSON.stringify(payload), 'JWTStartegy PAYLOAD');

    /* Validate session on sessionUUid */
    const session = await this.usersService.findSessionByUuid(
      payload.sessionUuid,
    );
    // this.logger.debug(
    //   JSON.stringify(session, (_, value) =>
    //     typeof value === 'bigint' ? value.toString() : value,
    //   ),
    //   'JwtStrategy SESSION',
    // );
    if (!session) {
      throw new UnauthorizedException(AUTH_MESSAGES.SESSION_NOT_FOUND);
    }
    /* check session is Active else session expire */
    if (!session.isActive) {
      // throw new UnauthorizedException('Session expired');
      throw new UnauthorizedException(AUTH_MESSAGES.SESSION_EXPIRED);
    }
    /* check session logout flag to validate session is not expired */
    if (session.logoutAt) {
      throw new UnauthorizedException(AUTH_MESSAGES.SESSION_LOGGED_OUT);
    }
    /* Validate User details */
    const user = await this.usersService.findByUuid(payload.uuid);

    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.USER_NOT_FOUND);
    }
    /* Check for user is Active else unacuthorize to access */
    if (!user.isActive) {
      throw new UnauthorizedException(AUTH_MESSAGES.USER_INACTIVE);
    }
    /* verify the session belongs to the same user  */
    if (session.userId !== user.id) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_SESSION);
    }
    /* update Last Activity of RequestApi */
    await this.usersService.updateLastActivity(payload.sessionUuid);
    /* Attach user request to API */
    return {
      uuid: user.uuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      sessionUuid: session.sessionUuid,
    };
  }
}
