import { APIGatewayProxyEvent } from 'aws-lambda';
import { QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { ok, badRequest, notFound, unauthorized, serverError, optionsResponse } from '../../shared/response';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const householdId = event.pathParameters?.id;
    const entryId = event.pathParameters?.entryId;
    if (!householdId || !entryId) return badRequest('householdId y entryId son requeridos.');

    const result = await db.send(new QueryCommand({
      TableName: Tables.CALENDAR,
      KeyConditionExpression: 'pk = :p AND begins_with(sk, :c)',
      FilterExpression: 'id = :eid',
      ExpressionAttributeValues: {
        ':p': `HOUSEHOLD#${householdId}`,
        ':c': 'CAL#',
        ':eid': entryId,
      },
    }));

    const item = result.Items?.[0];
    if (!item) return notFound('Entrada no encontrada.');

    await db.send(new DeleteCommand({
      TableName: Tables.CALENDAR,
      Key: { pk: item.pk, sk: item.sk },
    }));

    return ok({ message: 'Entrada eliminada.' });
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
