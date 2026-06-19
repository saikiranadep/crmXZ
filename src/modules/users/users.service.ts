import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findByUuid(uuid: string) {
    return this.prisma.user.findUnique({
      where: {
        uuid,
      },
    });
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  async updateRefreshToken(userId: bigint, refreshToken: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken,
      },
    });
  }

  /* create User Session and store in user_sessions table  */
  async createSession(data: {
    userId: bigint;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.userSession.create({
      data: {
        userId: data.userId,

        ipAddress: data.ipAddress,

        userAgent: data.userAgent,
      },
    });
  }

  /* Logout from device by verfiying sessionUuid from sessions */
  async logoutSession(sessionUuid: string) {
    return this.prisma.userSession.update({
      where: {
        sessionUuid,
      },

      data: {
        isActive: false,

        logoutAt: new Date(),

        lastActivityAt: new Date(),
      },
    });
  }

  /* Find Active session from sessionUuid from sessions */
  async findSessionByUuid(sessionUuid: string) {
    return this.prisma.userSession.findUnique({
      where: {
        sessionUuid,
      },
    });
  }

  /* Update Last Acticity of user and stores datetime of lastactivity */
  async updateLastActivity(sessionUuid: string) {
    return this.prisma.userSession.update({
      where: {
        sessionUuid,
      },

      data: {
        lastActivityAt: new Date(),
      },
    });
  }
}
