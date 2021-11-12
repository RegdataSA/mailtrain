// importing classes
const {EngineClient, RequestBuilder, TokenProvider, RPSContext} = require('rps-engine-client-js/lib')

const ENGINE_HOST_NAME = 'https://engine.rpsprod.ch'

// defining contexts
const rightsContext = new RPSContext([{name: 'Role', value: 'Admin'}])
const encryptProcessingContext = new RPSContext([{name: 'Action', value: 'Protect'}])
const decryptProcessingContext = new RPSContext([{name: 'Action', value: 'Deprotect'}])

// Request criteria
const Criteria = {
  TEMPLATE: 'Template',
  SUBSCRIBER: 'Subscriber',
  CAMPAIGN_SETTINGS: 'Campaign Settings'
}

const Instances = {
  [Criteria.TEMPLATE]: { // Request criteria
    text: { // Request criteria property
      className: 'Template',
      propertyName: 'Text'
    },
    name: { // Request criteria property
      className: 'Template',
      propertyName: 'Name'
    },
    description: { // Request criteria property
      className: 'Template',
      propertyName: 'Description'
    }
  },
  [Criteria.CAMPAIGN_SETTINGS]: {
    from_email_override: {
      className: 'Campaign Settings',
      propertyName: 'From email'
    },
    from_email: {
      className: 'Campaign Settings',
      propertyName: 'From email'
    },
    reply_to_override: {
      className: 'Campaign Settings',
      propertyName: 'Reply email'
    },
    reply_to: {
      className: 'Campaign Settings',
      propertyName: 'Reply email'
    }
  },
  [Criteria.SUBSCRIBER]: {
    email: {
      className: 'Subscriber',
      propertyName: 'Email'
    }
  }
}

const Actions = {
  ENCRYPT: 'ENCRYPT',
  DECRYPT: 'DECRYPT'
}

/**
 * EngineProvider class
 *
 * Helper class for initialization and using EngineClient via Request Criteria
 *
 * @param {TokenProvider} tokenProvider - instance of TokenProvider
 *
 */

class EngineProvider {
  constructor (tokenProvider) {
    // creating an instance of the class EngineClient using 'ENGINE_HOST_NAME' and 'tokenProvider'
    this.engineClient = new EngineClient({
      config: {baseURL: ENGINE_HOST_NAME},
      tokenProvider
    })
  }

  static getTransformedProperties (requestCriteria) {
    return Instances[requestCriteria]
  }

// generates a valid array of instances
  static generateInstances (instance, transformedProperties) {
    return Object.entries(transformedProperties)
      .reduce((acc, [property, {propertyName, className}]) => {
        const value = instance[property]
        return typeof value === 'undefined' ? acc : [...acc, {className, propertyName, value}]
      }, [])
  }

// generates a valid requestBody
  static generateRequestBody ({instance, transformedProperties, processingContext}) {
    const instances = EngineProvider.generateInstances(instance, transformedProperties)

    if (instances.length > 0) {
      return new RequestBuilder()
        .addRequest({instances, rightsContext, processingContext})
        .build()
    } else {
      return undefined
    }
  }

// parses response and substitutes the transformed values into the original object
  static parseResponse ({instance, response, transformedProperties}) {
    const {data: {responses = []}} = response || {}
    const {instances = []} = (Array.isArray(responses) && responses[0]) || {}

    return Object.entries(instance)
      .reduce((acc, [property, value]) => {
        const requestCriteriaProperty = transformedProperties[property]
        const processedValue = !!requestCriteriaProperty
          ? (instances.find(({propertyName}) => propertyName === requestCriteriaProperty.propertyName)).transformed
          : value

        return {...acc, [property]: processedValue}
      }, {})
  }

  async transform ({instance, requestBody, transformedProperties}) {
    try {
      const response = await this.engineClient.transform(requestBody)

      return EngineProvider.parseResponse({instance, response, transformedProperties})
    } catch (e) {
      console.error('error', e)
    }
  }

  async transformInstance (instance, requestCriteria, action = Actions.ENCRYPT) {
    const transformedProperties = EngineProvider.getTransformedProperties(requestCriteria)

    const needTransform = typeof transformedProperties !== 'undefined' && Object.keys(transformedProperties).length > 0

    if (!needTransform) {
      return instance
    } else {
      const requestBody = EngineProvider.generateRequestBody({
        instance,
        transformedProperties,
        processingContext: action === Actions.ENCRYPT ? encryptProcessingContext : decryptProcessingContext
      })
      const validRequestBody = typeof requestBody !== 'undefined'

      if (!validRequestBody) {
        return instance
      } else {
        return this.transform({instance, requestBody, transformedProperties})
      }
    }
  }

  // final method for ENCRYPT
  async encryptInstance (instance, requestCriteria) {
    return this.transformInstance(instance, requestCriteria, Actions.ENCRYPT)
  }

  // final method for DECRYPT
  async decryptInstance (instance, requestCriteria) {
    return this.transformInstance(instance, requestCriteria, Actions.DECRYPT)
  }
}


module.exports = {
  EngineProvider,
  TokenProvider,
  Criteria
}
