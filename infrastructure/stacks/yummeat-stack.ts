import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as path from 'path';

export class YummeatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── DynamoDB Tables ─────────────────────────────────────────────────────

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'yummeat-users',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const householdsTable = new dynamodb.Table(this, 'HouseholdsTable', {
      tableName: 'yummeat-households',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI para buscar hogar por código de invitación
    householdsTable.addGlobalSecondaryIndex({
      indexName: 'InviteCodeIndex',
      partitionKey: { name: 'inviteCode', type: dynamodb.AttributeType.STRING },
    });

    const recipesTable = new dynamodb.Table(this, 'RecipesTable', {
      tableName: 'yummeat-recipes',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const calendarTable = new dynamodb.Table(this, 'CalendarTable', {
      tableName: 'yummeat-calendar',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ─── JWT Secret en SSM ───────────────────────────────────────────────────

    const jwtSecret = new ssm.StringParameter(this, 'JwtSecret', {
      parameterName: '/yummeat/jwt-secret',
      stringValue: this.generateSecret(),
      description: 'JWT signing secret for Yummeat',
    });

    // ─── Lambda Environment ──────────────────────────────────────────────────

    const lambdaEnv: Record<string, string> = {
      USERS_TABLE: usersTable.tableName,
      HOUSEHOLDS_TABLE: householdsTable.tableName,
      RECIPES_TABLE: recipesTable.tableName,
      CALENDAR_TABLE: calendarTable.tableName,
      AWS_REGION_NAME: 'us-east-2',
      SES_FROM_EMAIL: 'no-reply@yummeat.app',
    };

    // ─── Lambda Role ─────────────────────────────────────────────────────────

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // DynamoDB permissions
    usersTable.grantReadWriteData(lambdaRole);
    householdsTable.grantReadWriteData(lambdaRole);
    recipesTable.grantReadWriteData(lambdaRole);
    calendarTable.grantReadWriteData(lambdaRole);

    // SES permission
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // SSM permission
    jwtSecret.grantRead(lambdaRole);

    // ─── Lambda Helper ───────────────────────────────────────────────────────

    const backendPath = path.join(__dirname, '../../backend');

    const createLambda = (name: string, handler: string) =>
      new lambda.Function(this, name, {
        functionName: `yummeat-${name.toLowerCase()}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler,
        code: lambda.Code.fromAsset(backendPath, {
          bundling: {
            image: lambda.Runtime.NODEJS_20_X.bundlingImage,
            command: [
              'bash', '-c',
              'npm ci && npx tsc && cp -r dist/* /asset-output/ && cp -r node_modules /asset-output/',
            ],
          },
        }),
        role: lambdaRole,
        timeout: cdk.Duration.seconds(15),
        memorySize: 256,
        environment: lambdaEnv,
      });

    // ─── Auth Lambdas ─────────────────────────────────────────────────────────

    const registerFn  = createLambda('Register',   'lambdas/auth/register.handler');
    const verifyFn    = createLambda('Verify',     'lambdas/auth/verify.handler');
    const loginFn     = createLambda('Login',      'lambdas/auth/login.handler');
    const resendFn    = createLambda('ResendCode', 'lambdas/auth/resendCode.handler');

    // ─── API Gateway ─────────────────────────────────────────────────────────

    const api = new apigateway.RestApi(this, 'YummeatApi', {
      restApiName: 'Yummeat API',
      description: 'Backend API for Yummeat App',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // /auth
    const auth = api.root.addResource('auth');
    auth.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(registerFn));
    auth.addResource('verify').addMethod('POST', new apigateway.LambdaIntegration(verifyFn));
    auth.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(loginFn));
    auth.addResource('resend-code').addMethod('POST', new apigateway.LambdaIntegration(resendFn));

    // ─── Outputs ──────────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL base de la API — copiala al .env de la app',
      exportName: 'YummeatApiUrl',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
    });
  }

  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    return Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
