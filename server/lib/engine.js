'use strict';

const {TokenProvider, EngineProvider, Criteria} = require('../../shared/engine');

const ENGINE_AUTH_HOST_NAME = 'https://identity.rpsprod.ch';

// configuration secrets
const CLIENT_ID = 'c6cbde13-542d-4849-a69e-3962ed09bc10';
const CLIENT_SECRET = '37571534bf6d40878fa77cb7b354b3274e6c047bd6404468b0fa2345cb7ebe61';
const secrets = {
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET
};

// creating an instance of the class TokenProvider using 'secrets' and 'ENGINE_AUTH_HOST_NAME'
const tokenProvider = new TokenProvider({
  identityServerHostName: ENGINE_AUTH_HOST_NAME,
  ...secrets
})

const engineProvider = new EngineProvider(tokenProvider)

module.exports = {
  engineProvider,
  tokenProvider,
  Criteria,
};
