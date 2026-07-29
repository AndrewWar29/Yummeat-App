import { APIGatewayProxyEvent } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { ok, notFound, unauthorized, serverError, optionsResponse } from '../../shared/response';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const householdId = event.pathParameters?.id;
    if (!householdId) return notFound('Hogar no encontrado.');

    const result = await db.send(new QueryCommand({
      TableName: Tables.HOUSEHOLDS,
      KeyConditionExpression: 'pk = :p',
      ExpressionAttributeValues: { ':p': `HOUSEHOLD#${householdId}` },
    }));

    const items = result.Items ?? [];
    const info = items.find((i) => i.sk === 'INFO');
    if (!info) return notFound('Hogar no encontrado.');

    const members = items
      .filter((i) => typeof i.sk === 'string' && i.sk.startsWith('MEMBER#'))
      .map((m) => ({ userId: m.userId, name: m.name, role: m.role, joinedAt: m.joinedAt }));

    return ok({
      id: householdId,
      name: info.name,
      adminId: info.adminId,
      inviteCode: info.inviteCode,
      members,
    });
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
