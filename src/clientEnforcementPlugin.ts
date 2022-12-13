
const { GraphQLError } = require('graphql');
// Plugin example for client ID enforcement
/** @type {import("@apollo/server").PluginInterface} */
const Stopwatch = require('statman-stopwatch');

interface LogInfo {
    gatewayRequestId: string;
    gqlLifecycleEvent: string;
    stopwatchReadMs?: number;
}

export function log(logInfo: LogInfo) { console.log(JSON.stringify({ ...logInfo, serviceName: 'books' })) };

export default function CloudWatchPlugin() {
    return {
        requestDidStart: (requestContext) => {
            const sw = new Stopwatch(true);
            const gatewayRequestId = requestContext.context.gatewayRequestId;

            log({
                gatewayRequestId,
                stopwatchReadMs: 0,
                gqlLifecycleEvent: 'requestDidStart'
            });

            return {
                didResolveSource() {
                    log({
                        gatewayRequestId,
                        stopwatchReadMs: sw.read(),
                        gqlLifecycleEvent: 'didResolveSource'
                    });
                },
                parsingDidStart() {
                    log({
                        gatewayRequestId,
                        stopwatchReadMs: sw.read(),
                        gqlLifecycleEvent: 'parsingDidStart'
                    });
                },
                validationDidStart() {
                    log({
                        gatewayRequestId,
                        stopwatchReadMs: sw.read(),
                        gqlLifecycleEvent: 'validationDidStart'
                    });
                },
                didResolveOperation() {
                    log({
                        gatewayRequestId,
                        stopwatchReadMs: sw.read(),
                        gqlLifecycleEvent: 'didResolveOperation'
                    });
                },
                executionDidStart() {
                    log({
                        gatewayRequestId,
                        stopwatchReadMs: sw.read(),
                        gqlLifecycleEvent: 'executionDidStart'
                    });
                },
                didEncounterErrors() {
                    log({
                        gatewayRequestId,
                        stopwatchReadMs: sw.read(),
                        gqlLifecycleEvent: 'didEncounterErrors'
                    });
                },
                willSendResponse() {
                    log({
                        gatewayRequestId,
                        stopwatchReadMs: sw.read(),
                        gqlLifecycleEvent: 'willSendResponse'
                    });
                    sw.stop();
                }
            }
        }
    }
}