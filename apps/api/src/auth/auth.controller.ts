import { TypedRoute } from '@nestia/core';
import { Body, Controller, UnauthorizedException } from '@nestjs/common';
import { ApiExcludeController, ApiExcludeEndpoint } from '@nestjs/swagger';
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

    console.log(this.authService.createToken(user as Users));

    return this.authService.createToken(user as Users);
  }

  private genUnauthException() {
    throw new UnauthorizedException(`Invalid login credentials`);
  }
}
