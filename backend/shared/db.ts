import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-2' });
export const db = DynamoDBDocumentClient.from(client);

export const Tables = {
  USERS: process.env.USERS_TABLE ?? 'yummeat-users',
  HOUSEHOLDS: process.env.HOUSEHOLDS_TABLE ?? 'yummeat-households',
  RECIPES: process.env.RECIPES_TABLE ?? 'yummeat-recipes',
  CALENDAR: process.env.CALENDAR_TABLE ?? 'yummeat-calendar',
};
