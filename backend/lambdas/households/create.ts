import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { created, badRequest, unauthorized, serverError, optionsResponse } from '../../shared/response';
import { generateInviteCode } from '../../shared/inviteCode';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const { name } = JSON.parse(event.body ?? '{}');
    if (!name) return badRequest('El nombre del hogar es requerido.');

    const userResult = await db.send(new GetCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${auth.email.toLowerCase()}` },
    }));
    const user = userResult.Item;
    if (!user) return badRequest('Usuario no encontrado.');

    const householdId = randomUUID();
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();

    await db.send(new PutCommand({
      TableName: Tables.HOUSEHOLDS,
      Item: { pk: `HOUSEHOLD#${householdId}`, sk: 'INFO', name, adminId: auth.userId, inviteCode, createdAt: now },
    }));

    await db.send(new PutCommand({
      TableName: Tables.HOUSEHOLDS,
      Item: {
        pk: `HOUSEHOLD#${householdId}`,
        sk: `MEMBER#${auth.userId}`,
        userId: auth.userId,
        name: user.name,
        role: 'admin',
        joinedAt: now,
      },
    }));

    await db.send(new UpdateCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${auth.email.toLowerCase()}` },
      UpdateExpression: 'SET householdId = :h',
      ExpressionAttributeValues: { ':h': householdId },
    }));

    return created({
      id: householdId,
      name,
      adminId: auth.userId,
      inviteCode,
      members: [{ userId: auth.userId, name: user.name, role: 'admin', joinedAt: now }],
    });
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
