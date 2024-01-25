import { TypedRoute } from '@nestia/core';
import {
  Body,
  Controller,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController, ApiExcludeEndpoint } from '@nestjs/swagger';
import { isEmpty } from 'class-validator';
import { Request } from 'express';
import { Users } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PublicEndpoint } from './decorators/public-endpoint.decorator';
import { AuthDto } from './dto/auth.dto';
import { GoogleGuard } from './guards/google-oauth.guard';

/**
 * Nice article Oauth 1: https://blog.stackademic.com/integrating-google-login-with-nestjs-using-passport-js-0f25e02e503b
 * Nice article Oauth 2: https://blog.stackademic.com/use-google-oauth-in-nextjs-and-nestjs-e70d98b0f898
 */

@ApiExcludeController()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ApiExcludeEndpoint()
  @TypedRoute.Post('login')
  @PublicEndpoint()
  async signIn(@Body() body: AuthDto) {
    const user = await this.usersService.findByUsername(body.username);
    if (isEmpty(user)) this.genUnauthException();

    // verif pass
    const isPassValid = await this.authService.verifyPassword(
      user as Users,
      body.password,
    );

    if (!isPassValid) this.genUnauthException();

    return this.authService.createToken(user as Users);
  }

  @TypedRoute.Get('login/google')
  @PublicEndpoint()
  @UseGuards(GoogleGuard)
  async signInGoogle() {}

  @TypedRoute.Get('callback/google')
  @PublicEndpoint()
  @UseGuards(GoogleGuard)
  async callbackGoogle(@Req() req: Request) {
    const user = req.user as any;

    return this.authService.googleLogin(user);
  }

  private genUnauthException() {
    throw new UnauthorizedException(`Invalid login credentials`);
  }
}
