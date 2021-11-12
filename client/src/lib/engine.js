import {TokenProvider, EngineProvider, Criteria} from '../../../shared/engine'
import {getUrl} from './urls'

// ClientTokenProvider - Proxy token provider from backend
class ClientTokenProvider extends TokenProvider {
  constructor () {
    super({
      identityServerHostName: getUrl(),
      authEndpoint: 'rest/connect/token'
    })
  }

  // allows validation with empty secrets (clientId = undefined, clientSecret = undefined)
  _validateGenerateToken (secrets) {
    return true
  }
}

const clientTokenProvider = new ClientTokenProvider()
const engineProvider = new EngineProvider(clientTokenProvider)

export {
  clientTokenProvider,
  engineProvider,
  Criteria
}
