import * as cdk from 'aws-cdk-lib';
import { YummeatStack } from '../stacks/yummeat-stack';

const app = new cdk.App();

new YummeatStack(app, 'YummeatStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-2',
  },
});
