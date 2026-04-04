import { APIGatewayProxyEvent } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { db, Tables } from '../../shared/db';
import { ok, badRequest, serverError, optionsResponse } from '../../shared/response';

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'us-east-2' });

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const { email } = JSON.parse(event.body ?? '{}');
    if (!email) return badRequest('Correo es requerido.');

    const result = await db.send(new GetCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${email.toLowerCase()}` },
    }));

    const user = result.Item;
    if (!user) return badRequest('Cuenta no encontrada.');
    if (user.verified) return badRequest('Esta cuenta ya está verificada.');

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db.send(new UpdateCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${email.toLowerCase()}` },
      UpdateExpression: 'SET verificationCode = :c, codeExpiry = :e',
      ExpressionAttributeValues: { ':c': newCode, ':e': codeExpiry },
    }));

    await ses.send(new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL ?? 'no-reply@yummeat.app',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Nuevo código de verificación - Yummeat' },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #E8472A;">Tu nuevo código 🍖</h2>
                <p>Hola <strong>${user.name}</strong>, aquí tienes un nuevo código:</p>
                <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E8472A;">${newCode}</span>
                </div>
                <p style="color: #757575; font-size: 13px;">Este código expira en 15 minutos.</p>
              </div>
            `,
          },
        },
      },
    }));

    return ok({ message: 'Nuevo código enviado a tu correo.' });
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
