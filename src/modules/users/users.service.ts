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
}
