import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { isEmpty } from 'class-validator';
import { Users } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PublicEndpoint } from './decorators/public-endpoint.decorator';
import { AuthDto } from './dto/auth.dto';

@ApiExcludeController()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
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

  private genUnauthException() {
    throw new UnauthorizedException(`Invalid login credentials`);
  }
}
