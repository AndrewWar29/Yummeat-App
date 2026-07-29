import { APIGatewayProxyEvent } from 'aws-lambda';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { ok, badRequest, notFound, unauthorized, forbidden, serverError, optionsResponse } from '../../shared/response';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const householdId = event.pathParameters?.id;
    const targetUserId = event.pathParameters?.userId;
    if (!householdId || !targetUserId) return notFound('Hogar o miembro no encontrado.');

    const infoResult = await db.send(new GetCommand({
      TableName: Tables.HOUSEHOLDS,
      Key: { pk: `HOUSEHOLD#${householdId}`, sk: 'INFO' },
    }));
    const info = infoResult.Item;
    if (!info) return notFound('Hogar no encontrado.');
    if (info.adminId !== auth.userId) return forbidden('Solo el admin puede eliminar miembros.');
    if (targetUserId === auth.userId) return badRequest('No puedes eliminarte a ti mismo.');

    await db.send(new DeleteCommand({
      TableName: Tables.HOUSEHOLDS,
      Key: { pk: `HOUSEHOLD#${householdId}`, sk: `MEMBER#${targetUserId}` },
    }));

    return ok({ message: 'Miembro eliminado.' });
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
