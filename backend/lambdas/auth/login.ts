import { APIGatewayProxyEvent } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { db, Tables } from '../../shared/db';
import { signToken } from '../../shared/jwt';
import { ok, badRequest, unauthorized, serverError, optionsResponse } from '../../shared/response';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const { email, password } = JSON.parse(event.body ?? '{}');

    if (!email || !password) {
      return badRequest('Correo y contraseña son requeridos.');
    }

    const result = await db.send(new GetCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${email.toLowerCase()}` },
    }));

    const user = result.Item;
    if (!user) return unauthorized('Correo o contraseña incorrectos.');

    if (!user.verified) {
      return badRequest('Debes verificar tu correo antes de iniciar sesión.');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) return unauthorized('Correo o contraseña incorrectos.');

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
