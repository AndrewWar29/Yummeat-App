import { APIGatewayProxyEvent } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../../shared/db';
import { signToken } from '../../shared/jwt';
import { ok, badRequest, serverError, optionsResponse } from '../../shared/response';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const { email, code } = JSON.parse(event.body ?? '{}');

    if (!email || !code) {
      return badRequest('Correo y código son requeridos.');
    }

    const result = await db.send(new GetCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${email.toLowerCase()}` },
    }));

    const user = result.Item;
    if (!user) return badRequest('Cuenta no encontrada.');
    if (user.verified) return badRequest('Esta cuenta ya está verificada.');
    if (user.verificationCode !== code) return badRequest('Código incorrecto.');
    if (new Date() > new Date(user.codeExpiry)) return badRequest('El código expiró. Solicita uno nuevo.');

    // Mark as verified
    await db.send(new UpdateCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${email.toLowerCase()}` },
      UpdateExpression: 'SET verified = :v REMOVE verificationCode, codeExpiry',
      ExpressionAttributeValues: { ':v': true },
    }));

    const token = signToken({ userId: user.userId, email: user.email });

    return ok({
      token,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        trialStart: user.trialStart,
        householdId: user.householdId ?? null,
      },
    });
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
