import { APIGatewayProxyEvent } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { ok, notFound, unauthorized, forbidden, serverError, optionsResponse } from '../../shared/response';
import { generateInviteCode } from '../../shared/inviteCode';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const householdId = event.pathParameters?.id;
    if (!householdId) return notFound('Hogar no encontrado.');

    const infoResult = await db.send(new GetCommand({
      TableName: Tables.HOUSEHOLDS,
      Key: { pk: `HOUSEHOLD#${householdId}`, sk: 'INFO' },
    }));
    const info = infoResult.Item;
    if (!info) return notFound('Hogar no encontrado.');
    if (info.adminId !== auth.userId) return forbidden('Solo el admin puede regenerar el código.');

    const inviteCode = generateInviteCode();

    await db.send(new UpdateCommand({
      TableName: Tables.HOUSEHOLDS,
      Key: { pk: `HOUSEHOLD#${householdId}`, sk: 'INFO' },
      UpdateExpression: 'SET inviteCode = :c',
      ExpressionAttributeValues: { ':c': inviteCode },
    }));

    return ok({ inviteCode });
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
