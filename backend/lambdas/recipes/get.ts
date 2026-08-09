import { APIGatewayProxyEvent } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { getUserFromEvent } from '../../shared/auth';
import { ok, notFound, unauthorized, serverError, optionsResponse } from '../../shared/response';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const auth = getUserFromEvent(event);
    if (!auth) return unauthorized();

    const id = event.pathParameters?.id;
    if (!id) return notFound('Receta no encontrada.');

    const result = await db.send(new GetCommand({
      TableName: Tables.RECIPES,
      Key: { pk: `RECIPE#${id}` },
    }));

    if (!result.Item) return notFound('Receta no encontrada.');

    const { pk, ...recipe } = result.Item;
    return ok(recipe);
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
