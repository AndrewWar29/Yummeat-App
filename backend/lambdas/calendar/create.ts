import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { created, badRequest, notFound, unauthorized, serverError, optionsResponse } from '../../shared/response';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const householdId = event.pathParameters?.id;
    if (!householdId) return badRequest('householdId es requerido.');

    const { recipeId, date, mealType } = JSON.parse(event.body ?? '{}');
    if (!recipeId || !date || !mealType) {
      return badRequest('recipeId, date y mealType son requeridos.');
    }

    const recipeResult = await db.send(new GetCommand({
      TableName: Tables.RECIPES,
      Key: { pk: `RECIPE#${recipeId}` },
    }));
    const recipeItem = recipeResult.Item;
    if (!recipeItem) return notFound('Receta no encontrada.');
    const { pk: _recipePk, ...recipe } = recipeItem;

    const userResult = await db.send(new GetCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${auth.email.toLowerCase()}` },
    }));
    const user = userResult.Item;
    if (!user) return badRequest('Usuario no encontrado.');

    const entryId = randomUUID();
    const entry = {
      id: entryId,
      householdId,
      userId: auth.userId,
      userName: user.name,
      date,
      mealType,
      recipe,
    };

    await db.send(new PutCommand({
      TableName: Tables.CALENDAR,
      Item: { pk: `HOUSEHOLD#${householdId}`, sk: `CAL#${date}#${mealType}#${entryId}`, ...entry },
    }));

    return created(entry);
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
