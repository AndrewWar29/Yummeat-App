export function ok(body: object) {
  return {
    statusCode: 200,
    headers: cors(),
    body: JSON.stringify(body),
  };
}

export function created(body: object) {
  return {
    statusCode: 201,
    headers: cors(),
    body: JSON.stringify(body),
  };
}

export function badRequest(message: string) {
  return {
    statusCode: 400,
    headers: cors(),
    body: JSON.stringify({ message }),
  };
}

export function unauthorized(message = 'No autorizado') {
  return {
    statusCode: 401,
    headers: cors(),
    body: JSON.stringify({ message }),
  };
}

export function notFound(message = 'No encontrado') {
  return {
    statusCode: 404,
    headers: cors(),
    body: JSON.stringify({ message }),
  };
}

export function serverError(message = 'Error interno del servidor') {
  return {
    statusCode: 500,
    headers: cors(),
    body: JSON.stringify({ message }),
  };
}

export function optionsResponse() {
  return { statusCode: 200, headers: cors(), body: '' };
}

function cors() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
}
