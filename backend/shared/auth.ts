import { APIGatewayProxyEvent } from 'aws-lambda';
import { verifyToken } from './jwt';

export function getUserFromEvent(event: APIGatewayProxyEvent): { userId: string; email: string } | null {
  try {
    const header = event.headers?.Authorization ?? event.headers?.authorization ?? '';
    const token = header.replace('Bearer ', '');
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
