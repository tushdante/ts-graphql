import { ApolloServer, ApolloServerPlugin, BaseContext } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLRequestContext } from 'apollo-server-types'
import { GraphQLRequestListener } from 'apollo-server-plugin-base/src/index'
import ApolloServerOperationRegistry from '@apollo/server-plugin-operation-registry';
import { GraphQLError } from 'graphql';
import cloudWatchPlugin, { log } from './clientEnforcementPlugin'


// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: [Book]
  }
`;

const books = [
    {
        title: 'The Awakening',
        author: 'Kate Chopin',
    },
    {
        title: 'City of Glass',
        author: 'Paul Auster',
    },
];

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        books: () => books,
    },
};

// Create options type (see: https://github.com/apollographql/confidential-gateway-customizations/blob/83887bd1dd6a6bc890b514b53f1e48e96ca9e77e/alphasense/src/plugins/auth/createAuthPlugin.ts)
type clientEnforcementPluginOptions = {
    defaultClientName?: string | null;
    defaultClientVersion?: number | null;
};

function clientEnforcementPlugin(options?: clientEnforcementPluginOptions): ApolloServerPlugin<BaseContext>  {
    return {
        async requestDidStart(_) {
            return {
                async didResolveOperation(requestContext) {
                    let clientName = requestContext.request.http.headers.get('apollographql-client-name') || options?.defaultClientName;
                    let clientVersion = requestContext.request.http.headers.get(
                        'apollographql-client-version'
                    ) || options?.defaultClientVersion;
    
                    if (!clientName) {
                        let logString = `Execution Denied: Operation has no identified client`;
                        requestContext.logger.debug(logString)
                        throw new GraphQLError(logString);
                    }
    
                    if (!clientVersion) {
                        let logString = `Execution Denied: Client ${clientName} has no identified version`;
                        requestContext.logger.debug(logString)
                        throw new GraphQLError(logString);
                    }
    
                    if (!requestContext.operationName) {
                        let logString = `Unnamed Operation: ${requestContext.queryHash}`;
                        requestContext.logger.debug(logString);
    
                        throw new GraphQLError(logString, {
                            extensions: {
                                queryHash: requestContext.queryHash,
                                clientName: clientName,
                                clientVersion: clientVersion,
                                exception: {
                                    message: `All operations must be named`
                                }
                            }
                        });
                    }
                },

                async didEncounterErrors(requestContext) {
                    requestContext.errors.forEach(error => {
                        requestContext.logger.error(error)
                        console.log(error.toString())
                    });
                }
            };
        },
    
    }
};

// define options
const pluginOpts: clientEnforcementPluginOptions = {
    defaultClientName: "apollo-test",
    defaultClientVersion: 1
}

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [clientEnforcementPlugin()]
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);