import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const user = await this.authService.validateUser(loginDto);
      const { access_token, refresh_token } = await this.authService.login(
        user,
        loginDto.rememberMe,
      );

      // Set cookies
      response.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000, // 1 hour
      });

      if (refresh_token) {
        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 604800000, // 7 days
        });
      }

      return response.redirect('/');
    } catch (error) {
      return response.redirect('/login?error=Invalid credentials');
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return response.redirect('/login');
  }
}
