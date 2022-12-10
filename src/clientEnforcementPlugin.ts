
const { GraphQLError } = require('graphql');
// Plugin example for client ID enforcement
/** @type {import("@apollo/server").PluginInterface} */
const clientEnforcementPlugin =  {
    // Return an obj with didResolveOperation
    // Add a tsconfig file to the proj
    requestDidStart: ({request, logger}) => {
      let clientName = request.http.headers.get('apollographql-client-name');
      let clientVersion = request.http.headers.get(
        'apollographql-client-version'
      );
  
      if (!clientName) {
        let logString = `Execution Denied: Operation has no identified client`;
        logger.debug(logString);
  
        throw new GraphQLError(logString);
      }
  
      if (!clientVersion) {
        let logString = `Execution Denied: Client ${clientName} has no identified version`;
        logger.debug(logString);
  
        throw new GraphQLError(logString);
      }
  
      return {
        parsingDidStart({queryHash, request}) {
          if (!request.operationName) {
            logger.debug(`Unnamed Operation: ${queryHash}`);
  
            let error = new GraphQLError('Execution denied: Unnamed operation');
  
            Object.assign(error.extensions, {
              queryHash: queryHash,
              clientName: clientName,
              clientVersion: clientVersion,
              exception: {
                message: `All operations must be named`
              }
            });
  
            throw error;
          }
        }
      };
    }
};

export default {
    async requestDidStart(requestContext) {
        console.log('Request started!');
    
        return {
          async parsingDidStart(requestContext) {
            console.log('Parsing started!');
          },
    
          async validationDidStart(requestContext) {
            console.log('Validation started!');
          },
        };
      },
  };
//export default clientEnforcementPlugin;