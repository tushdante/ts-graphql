import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLRequestContext } from 'apollo-server-types'
import { GraphQLRequestListener } from 'apollo-server-plugin-base/src/index'
import ApolloServerOperationRegistry from '@apollo/server-plugin-operation-registry';
import { GraphQLError } from 'graphql';


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


// const clientEnforcementPlugin: ApolloServerPlugin = {
// async requestDidStart(requestContext) {
//     console.log('Request started!');

//     return {
//     // async parsingDidStart(requestContext) {
//     //     console.log('Parsing started!');
//     // },

//     // async validationDidStart(requestContext) {
//     //     console.log('Validation started!');
//     // },

//     async didResolveOperation(requestContext, logger) {
//         let clientName = requestContext.http.headers.get('apollographql-client-name');
//         let clientVersion = requestContext.http.headers.get(
//           'apollographql-client-version'
//         );

//         if (!clientName) {
//           let logString = `Execution Denied: Operation has no identified client`;
//           logger.debug(logString);

//           return async (err) => {
//             if (err) {
//                 new GraphQLError(logString)
//             }
//           }
//           //throw new GraphQLError(logString);
//         }

//         if (!clientVersion) {
//           let logString = `Execution Denied: Client ${clientName} has no identified version`;
//           logger.debug(logString);

//           return async (err) => {
//             if (err) {
//                 new GraphQLError(logString)
//             }
//           }
//         }

//         // return {
//           async parsingDidStart({queryHash, requestContext}) {
           
//           }
//         };  
// //     },
// //     };
// },
// };
///** @type {import("@apollo/server").PluginInterface} */
const clientEnforcementPlugin: ApolloServerPlugin = {

    async requestDidStart(requestContext) {
        console.log('Request started!');

        return {
            async parsingDidStart(requestContext) {
                console.log('Parsing started!');
                if (!requestContext.operationName) {
                   // logger.debug(`Unnamed Operation: ${queryHash}`);
      
                    let error = new GraphQLError('Execution denied: Unnamed operation');
      
                    Object.assign(error.extensions, {
                      queryHash: requestContext.queryHash,
                      clientName: requestContext.clientName,
                      clientVersion: clientVersion,
                      exception: {
                        message: `All operations must be named`
                      }
                    });
      
                    throw error;
                  }
            },

            async validationDidStart(requestContext) {
                console.log('Validation started!');
            },

            async didResolveOperation(requestContext) {
                //console.log(requestContext)
                let clientName = requestContext.request.http.headers.get('apollographql-client-name');
                let clientVersion = requestContext.request.http.headers.get(
                    'apollographql-client-version'
                );

                if (!clientName) {
                    let logString = `Execution Denied: Operation has no identified client`;
                    requestContext.logger.debug(logString)
                    // return async (err) => {
                    //     if (err) {
                    //         new GraphQLError(logString)
                    //     }
                    // }
                    throw new GraphQLError(logString);
                }

                if (!clientVersion) {
                    let logString = `Execution Denied: Client ${clientName} has no identified version`;


                    // return async (err) => {
                    //     if (err) {
                    //         new GraphQLError(logString)
                    //     }
                    // }
                    throw new GraphQLError(logString);
                }

            }
        };
    },


};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [clientEnforcementPlugin]
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);