// amplify/backend.ts
import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { waitlist } from "./functions/waitlist/resource";

// Create backend with our function
const backend = defineBackend({ waitlist });

// ====== API Gateway (REST) with Lambda integration ======
const apiStack = backend.createStack("api-stack");
const rest = new apigw.RestApi(apiStack, "WaitlistApi", {
  restApiName: "WaitlistApi",
  deploy: true,
  deployOptions: { stageName: "prod" },
  defaultCorsPreflightOptions: {
    // Restrict later to your domain (e.g., https://yourdomain.com)
    allowOrigins: apigw.Cors.ALL_ORIGINS,
    allowMethods: apigw.Cors.ALL_METHODS,
    allowHeaders: apigw.Cors.DEFAULT_HEADERS,
  },
});

const lambdaIntegration = new apigw.LambdaIntegration(
  backend.waitlist.resources.lambda
);

// POST /waitlist
const waitlistPath = rest.root.addResource("waitlist", {
  defaultMethodOptions: { authorizationType: apigw.AuthorizationType.NONE },
});
waitlistPath.addMethod("POST", lambdaIntegration);

// Expose API endpoint to the app’s outputs (used by frontend if desired)
backend.addOutput({
  custom: {
    API: {
      [rest.restApiName]: {
        endpoint: rest.url,
        region: Stack.of(rest).region,
        apiName: rest.restApiName,
      },
    },
  },
});

// ====== DynamoDB table for signups ======
const dataStack = backend.createStack("data-stack");
const table = new dynamodb.Table(dataStack, "WaitlistSignups", {
  tableName: undefined, // let CDK generate (safe for multiple envs)
  partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
});

// Grant the Lambda write permissions
table.grantWriteData(backend.waitlist.resources.lambda);

// Inject the resolved table name into the function env
backend.waitlist.addEnvironment("WAITLIST_TABLE_NAME", table.tableName);
