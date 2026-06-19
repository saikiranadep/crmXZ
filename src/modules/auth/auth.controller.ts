import { Body, Controller, Post, Req, Get, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';

import { LoginDto } from './dto/login.dto';

import type { Request } from 'express';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
// import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    // console.log('getProfile', req);
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    // console.log(req.user);
    return this.authService.logout(req.user.sessionUuid);
  }

  @Post('register')
  register(
    @Body()
    dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(
    @Body()
    dto: LoginDto,
    @Req() req: Request,
  ) {
    return this.authService.login(dto, req);
  }
}
