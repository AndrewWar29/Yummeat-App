import { APIGatewayProxyEvent } from 'aws-lambda';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../../shared/db';
import { ok, badRequest, serverError, optionsResponse } from '../../shared/response';

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'us-east-2' });

export const handler = async (event: APIGatewayProxyEvent) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  try {
    const { name, email, password } = JSON.parse(event.body ?? '{}');

    if (!name || !email || !password) {
      return badRequest('Nombre, correo y contraseña son requeridos.');
    }
    if (password.length < 8) {
      return badRequest('La contraseña debe tener al menos 8 caracteres.');
    }

    // Check if email already exists
    const existing = await db.send(new GetCommand({
      TableName: Tables.USERS,
      Key: { pk: `USER#${email.toLowerCase()}` },
    }));

    if (existing.Item) {
      return badRequest('Ya existe una cuenta con este correo.');
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    await db.send(new PutCommand({
      TableName: Tables.USERS,
      Item: {
        pk: `USER#${email.toLowerCase()}`,
        userId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        verified: false,
        verificationCode,
        codeExpiry,
        subscriptionStatus: 'trial',
        trialStart: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    }));

    // Send verification email via SES
    await ses.send(new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL ?? 'no-reply@yummeat.app',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Tu código de verificación - Yummeat' },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #E8472A;">¡Bienvenido a Yummeat! 🍖</h2>
                <p>Hola <strong>${name}</strong>, usa este código para verificar tu cuenta:</p>
                <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E8472A;">${verificationCode}</span>
                </div>
                <p style="color: #757575; font-size: 13px;">Este código expira en 15 minutos.</p>
              </div>
            `,
          },
        },
      },
    }));

    return ok({ message: 'Código de verificación enviado a tu correo.', email: email.toLowerCase() });
  } catch (err) {
    console.error(err);
    return serverError();
  }
};
