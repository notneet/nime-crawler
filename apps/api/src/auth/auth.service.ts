import { Injectable, PreconditionFailedException } from '@nestjs/common';
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

  /**
   * Promise {
  {
    user: { id: 1, name: 'Hanivan', username: 'hanivanrizky', role: 'admin' },
    expiresIn: '1d',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imhhbml2YW5yaXpreSIsInVzZXJfaWQiOjEsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcxNTY4NDgxMSwiZXhwIjoxNzE1NzcxMjExfQ.Yl3KnwXu6MxV3h4gbDhzagG-q_Ptc3FftlwU4sUxHWI'
  }
}
   */
  async createToken(user: Users): Promise<{
    user: {
      id: number;
      name: string;
      username: string;
      role: string;
    };
    expiresIn: string;
    accessToken: string;
  }> {
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
        role: String(user?.role),
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
