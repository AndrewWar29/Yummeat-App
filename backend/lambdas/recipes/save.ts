import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { created, badRequest, unauthorized, serverError, optionsResponse } from '../../shared/response';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const { name, ingredients, steps, estimatedMinutes } = JSON.parse(event.body ?? '{}');
    if (!name || !Array.isArray(ingredients) || !Array.isArray(steps)) {
      return badRequest('Nombre, ingredientes y pasos son requeridos.');
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    const recipe = {
      id,
      name,
      ingredients,
      steps,
      estimatedMinutes: estimatedMinutes ?? 0,
      createdBy: auth.userId,
      createdAt,
    };

    await db.send(new PutCommand({
      TableName: Tables.RECIPES,
      Item: { pk: `RECIPE#${id}`, ...recipe },
    }));

    return created(recipe);
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
