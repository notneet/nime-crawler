import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  GoogleCallbackParameters,
  Profile,
  Strategy,
  VerifyCallback,
} from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super(
      {
        clientID: configService.get('GOOGLE_CLIENT_ID'),
        clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
        callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
        scope: ['email', 'profile', 'openid'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        params: GoogleCallbackParameters,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        const { expires_in, id_token } = params;
        const {
          id,
          name,
          emails,
          profileUrl,
          _json: { email_verified },
        } = profile;
        const user = {
          providerAccountId: id,
          email: emails,
          email_verified,
          firstName: name?.givenName,
          lastName: name?.familyName,
          picture: profileUrl,
          accessToken,
          refreshToken,
          id_token,
          expires_in,
        };
        done(null, user);
      },
    );
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    params: GoogleCallbackParameters,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos, username, profileUrl } = profile;

    const user = {
      provider: 'google',
      providerId: id,
      email: username,
      name: `${name?.givenName} ${name?.familyName}`,
      picture: profileUrl,
    };

    done(null, user);
  }
}
