import { APIGatewayProxyEvent } from 'aws-lambda';
import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { ok, badRequest, unauthorized, serverError, optionsResponse } from '../../shared/response';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const { inviteCode } = JSON.parse(event.body ?? '{}');
    if (!inviteCode) return badRequest('El código de invitación es requerido.');

    const queryResult = await db.send(new QueryCommand({
      TableName: Tables.HOUSEHOLDS,
      IndexName: 'InviteCodeIndex',
      KeyConditionExpression: 'inviteCode = :c',
      ExpressionAttributeValues: { ':c': inviteCode.toUpperCase() },
    }));

    const info = queryResult.Items?.[0];
    if (!info) return badRequest('Código incorrecto o expirado.');

    const householdId = info.pk.replace('HOUSEHOLD#', '');

    const userResult = await db.send(new GetCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${auth.email.toLowerCase()}` },
    }));
    const user = userResult.Item;
    if (!user) return badRequest('Usuario no encontrado.');

    const now = new Date().toISOString();

    await db.send(new PutCommand({
      TableName: Tables.HOUSEHOLDS,
      Item: {
        pk: `HOUSEHOLD#${householdId}`,
        sk: `MEMBER#${auth.userId}`,
        userId: auth.userId,
        name: user.name,
        role: 'member',
        joinedAt: now,
      },
    }));

    await db.send(new UpdateCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${auth.email.toLowerCase()}` },
      UpdateExpression: 'SET householdId = :h',
      ExpressionAttributeValues: { ':h': householdId },
    }));

    const membersResult = await db.send(new QueryCommand({
      TableName: Tables.HOUSEHOLDS,
      KeyConditionExpression: 'pk = :p AND begins_with(sk, :m)',
      ExpressionAttributeValues: { ':p': `HOUSEHOLD#${householdId}`, ':m': 'MEMBER#' },
    }));

    const members = (membersResult.Items ?? []).map((m) => ({
      userId: m.userId,
      name: m.name,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

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
