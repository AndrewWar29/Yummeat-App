import { APIGatewayProxyEvent } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { ok, badRequest, unauthorized, serverError, optionsResponse } from '../../shared/response';

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const householdId = event.pathParameters?.id;
    const weekStart = event.queryStringParameters?.weekStart;
    if (!householdId || !weekStart) return badRequest('householdId y weekStart son requeridos.');

    const weekEnd = addDays(weekStart, 6);

    const result = await db.send(new QueryCommand({
      TableName: Tables.CALENDAR,
      KeyConditionExpression: 'pk = :p AND begins_with(sk, :c)',
      ExpressionAttributeValues: { ':p': `HOUSEHOLD#${householdId}`, ':c': 'CAL#' },
    }));

    const entries = (result.Items ?? [])
      .filter((item) => item.date >= weekStart && item.date <= weekEnd)
      .map(({ pk, sk, ...entry }) => entry);

    return ok(entries);
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
