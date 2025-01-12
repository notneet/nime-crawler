import { jwtConstants } from '@commons/constants';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from './types/user.type';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private readonly users: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      // This is a hashed version of 'admin123'
      password: '$2b$10$x1r7HfbxkLf8lqX2WLkUZ.nckhQqNyP9KOiGMlocoTZijlcF2pipu',
    },
  ];

  async validateUser(loginDto: LoginDto) {
    const user = this.users.find((u) => u.email === loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...result } = user;
    return result;
  }

  async login(user: any, rememberMe: boolean = false) {
    const payload = { email: user.email, sub: user.id };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.expiresIn,
    });

    const refreshToken = rememberMe
      ? this.jwtService.sign(payload, {
          secret: jwtConstants.secret,
          expiresIn: jwtConstants.refreshExpiresIn,
        })
      : null;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
