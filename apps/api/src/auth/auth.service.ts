import {
  Injectable,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { isEmpty } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { Users } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  async verifyPassword(user: Users, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async createToken(user: Users) {
    const payload = {
      username: user.username,
      user_id: user.id,
      role: user.role,
    };

    const jwtToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpires,
    });

    return {
      user: {
        id: user?.id,
        name: user?.name,
        username: user?.username,
        role: user?.role,
      },
      expiresIn: this.jwtExpires,
      accessToken: jwtToken,
    };
  }

  async googleLogin(user: any) {
    if (!user) {
      throw new UnauthorizedException('No user from google');
    }
    const payload = {
      email: user.email,
      user_id: user.providerAccountId,
      picture: user.picture,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    };

    const jwtToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpires,
    });

    return {
      user: {
        ...payload,
      },
      expiresIn: this.jwtExpires,
      accessToken: jwtToken,
    };
  }

  /**
   *
   */

  private get jwtExpires() {
    const expiration = this.config.get<string>('JWT_EXPIRES_IN', '');
    if (isEmpty(expiration)) {
      throw new PreconditionFailedException(`JWT_EXPIRES_IN are not set`);
    }

    return expiration;
  }

  private get jwtSecret() {
    const secKey = this.config.get<string>('JWT_SECRET', '');
    if (isEmpty(secKey)) {
      throw new PreconditionFailedException(`JWT_SECRET are not set`);
    }

    return secKey;
  }
}
