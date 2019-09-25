import { Query, Params } from "@feathersjs/feathers";
import { NotAuthenticated, BadRequest } from "@feathersjs/errors";
import {
  AuthenticationBaseStrategy,
  AuthenticationResult
} from "@feathersjs/authentication";

interface RefreshTokenData {
  id?: any;
  refreshToken: String;
  clientId: String;
}

export class RefreshTokenStrategy extends AuthenticationBaseStrategy {
  verifyConfiguration() {
    const config = this.configuration;
    ["entity", "service"].forEach(p => {
      if (typeof config[p] !== "string") {
        throw new Error(
          `'${this.name}' authentication strategy requires a '${p}' setting`
        );
      }
    });
  }

  get configuration() {
    const authConfig = this.authentication!.configuration;
    const config = super.configuration || {};
    return {
      errorMessage: "Invalid login",
      ...config
    };
  }

  async getEntityQuery(query: Query, _params: Params) {
    return {
      $limit: 1,
      ...query
    };
  }

  async findEntity(data: RefreshTokenData, params: Params) {
    const { entityService } = this;
    const query = this.getEntityQuery(
      {
        refreshToken: data.refreshToken,
        clientId: data.clientId
      },
      params
    );
    const result = await entityService.find({ query });
    if (result.total === 0) {
      throw new NotAuthenticated();
    }
    return result.data[0];
  }

  async authenticate(
    authenticationRequest: AuthenticationResult,
    params: Params
  ) {
    ["refreshToken", "clientId"].forEach(p => {
      if (p in authenticationRequest) return;
      throw new BadRequest(`${p} is missing from request`);
    });

    const { refreshToken, clientId } = authenticationRequest;

    const token: RefreshTokenData = await this.findEntity(
      { refreshToken, clientId },
      params
    );

    const accessToken = await this.app!.service(
      "authentication"
    ).createAccessToken({ sub: token.clientId });

    return { accessToken };
  }
}
