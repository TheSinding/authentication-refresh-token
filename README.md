# Refresh Tokens Strategy for Feathers Authentication

This strategy adds refresh tokens to feathersjs authentication.

## Requirements

Currently it only supports when it's used in conjunction with the "Local Strategy" aswell.

## What it does

When a user authenticates with local authentication, the receive a "Refresh Token" which the user can use to create new JWT access tokens.

## Installation

To install and use the strategy, first run `npm install`.
`npm install @thesinding/authentication-refresh-token`

Now add the strategy to your `authentication.(ts|js)` like so:

```javascript
... // other imports
const { RefreshTokenStrategy } =  require('@thesinding/authentication-refresh-token');

module.exports  =  app  => {
	... // Other authentications strategies
	authentication.register('refresh-token', new  RefreshTokenStrategy()); // add the strategy
	... // Rest of the file
};
```

Then add the authentication hook like so:

```javascript
const { RefreshTokenStrategy, addRefreshToken } =  require('@thesinding/authentication-refresh-token');

module.exports  =  app  => {
	... // Other authentications strategies
	authentication.register('refresh-token', new  RefreshTokenStrategy()); // add the strategy

	app.service('authentication').hooks({ // you might have to add this
		... // before hooks
		after: {
			create: [addRefreshToken()] // add the hook
		},
		// error hooks
	});
	... // Rest of the file
};
```

Create a service, this is where your app will store the refresh tokens.
Use what every database adapter you want, depending on your setup.
`feathers generate service`

Now it all need to be added in the configuration:

```jsonc
{
  "host": "localhost",
  "port": 3030,
  "public": "../public/",
  "paginate": {
    "default": 10,
    "max": 50
  },
  "authentication": {
	 // other settings
    "authStrategies": [
      "jwt",
      "local",
      "refresh-token" // Add the refresh token as a strategy
    ],
    "jwtOptions": {  // Your JWT options  },
    // other strategies,
    "refresh-token": {
	  "entity": "refresh-token", // this needs to be the same as in your model (if you have one)
	  "service": "refresh-tokens", // The service which you have created
	  "clientIdField": "clientId" // the name of the client id field
    }
   }
}

```

Done.

Try to authenticate as normal eg.

```http
curl -H "Content-Type: application/json" -X POST -d '{ "strategy": "local", "email":"example@example.com","password":"X2y6" }' http://localhost:3030/authenticate
```

The response should look something like this:

```jsonc
{
    "authentication": {
        "strategy": "local"
    },
    "accessToken": "TOKEN DATA", // The access token
    "user": { // User data },
    "refreshToken": "9683fe86-aef1-4b3d-a0eb-da57624c62cf" // Store this token
}
```

The `refreshToken` can now be used to refresh the `accessToken` like so:

```http
curl -H "Content-Type: application/json" -X POST -d '{ "strategy": "refresh-token", "clientId": "The ID of the user", "refreshToken": "The clients refresh token" }' http://localhost:3030/authenticate
```

It's respond should look similar to this, if the `refreshToken` and the `clientId` matches:

```jsonc
{
  "authentication": {
    "strategy": "refresh-token"
  },
  "accessToken": "TOKEN DATA" // The refreshed access token
}
```

## This is still new, so use with caution.

## Changelog:

```text
0.0.1 - initial release
```
