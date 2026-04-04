# Yummeat App — Plan de Implementación

## 1. Stack Tecnológico

### Frontend
**React Native** (recomendado sobre Flutter por la siguiente razón: mayor ecosistema de librerías para integraciones con RevenueCat, Stripe y visión artificial, además de una curva de aprendizaje más suave si ya tienes base en JavaScript/TypeScript.)

| Librería | Uso |
|---|---|
| `expo` | Base del proyecto (managed workflow) |
| `react-navigation` | Navegación entre pantallas |
| `react-native-revenuecat` | Paywall / suscripciones |
| `expo-camera` / `expo-image-picker` | Función Scan & Cook |
| `react-native-calendars` | Calendario semanal compartido |
| `zustand` | State management global |

---

### Backend — AWS Serverless
Dado tu experiencia con AWS, se propone una arquitectura **serverless** para minimizar costos y escalar automáticamente.

```
Cliente (React Native)
        │
        ▼
  API Gateway (REST)
        │
        ▼
  AWS Lambda (Node.js / TypeScript)
        │
    ┌───┴────────────────────────┐
    ▼                            ▼
DynamoDB                      S3 Bucket
(usuarios, hogares,          (fotos del
 recetas, calendarios)        refrigerador)
    │
    ▼
AWS Cognito
(autenticación)
```

| Servicio AWS | Función |
|---|---|
| **API Gateway** | Exposición de endpoints REST |
| **Lambda** | Lógica de negocio (Node.js/TypeScript) |
| **DynamoDB** | Base de datos NoSQL (usuarios, hogares, recetas) |
| **S3** | Almacenamiento de imágenes para Scan & Cook |
| **Cognito** | Registro, login, tokens JWT |
| **SES** | Envío de emails (invitaciones a hogares) |
| **CloudWatch** | Logs y monitoreo |

---

### IA y Vision
| Proveedor | Modelo | Uso |
|---|---|---|
| **Groq** | `llama3-70b` o `mixtral-8x7b` | Generación de recetas por texto (ultrarrápido) |
| **OpenAI** | `gpt-4o-mini` con visión | Análisis de foto del refrigerador |
| **Alternativa visión** | Google Gemini Flash | Más barato que GPT-4o para imágenes |

---

### Pagos
| Herramienta | Uso |
|---|---|
| **RevenueCat** | Gestión de suscripciones iOS/Android (recomendado) |
| **Stripe** | Pagos web / fallback |

---

## 2. Arquitectura de Base de Datos (DynamoDB)

### Tabla: `Users`
| PK | SK | Atributos |
|---|---|---|
| `USER#<id>` | `PROFILE` | nombre, email, hogar_id, trial_start, subscription_status |

### Tabla: `Households`
| PK | SK | Atributos |
|---|---|---|
| `HOUSEHOLD#<id>` | `INFO` | nombre, admin_id, codigo_invitacion |
| `HOUSEHOLD#<id>` | `MEMBER#<user_id>` | rol (admin/miembro), fecha_union |
| `HOUSEHOLD#<id>` | `CALENDAR#<fecha>` | user_id, receta_id, comida (almuerzo/cena) |

### Tabla: `Recipes`
| PK | SK | Atributos |
|---|---|---|
| `RECIPE#<id>` | `INFO` | nombre, ingredientes[], pasos[], tiempo_estimado, created_by |

---

## 3. Endpoints de la API

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`

### Hogares
- `POST /households` — Crear hogar
- `POST /households/join` — Unirse con código de invitación
- `GET /households/{id}/members` — Ver integrantes
- `DELETE /households/{id}/members/{userId}` — Eliminar miembro

### Calendario
- `GET /households/{id}/calendar?week=2026-W14` — Ver semana
- `POST /households/{id}/calendar` — Asignar receta a un día
- `DELETE /households/{id}/calendar/{entryId}` — Eliminar entrada

### Recetas (IA)
- `POST /recipes/generate` — Generar receta por nombre de plato (Groq)
- `POST /recipes/scan` — Analizar foto de refrigerador (OpenAI Vision)
- `GET /recipes/{id}` — Ver receta guardada

### Lista de Compras
- `GET /households/{id}/shopping-list?week=2026-W14` — Lista consolidada de la semana

### Suscripciones
- `POST /subscriptions/verify` — Verificar estado con RevenueCat webhook

---

## 4. Flujos Principales

### A. Crear / Unirse a un Hogar
```
1. Admin crea hogar → se genera código único de 6 caracteres
2. Admin comparte código (WhatsApp, SMS, etc.)
3. Invitado ingresa el código en la app → queda vinculado al hogar
4. Ambos ven el mismo calendario y lista de compras
```

### B. Generar Receta (Groq)
```
1. Usuario escribe nombre del plato: "Lasaña"
2. App llama a Lambda → Lambda llama a Groq API
3. Prompt enviado a Groq:
   "Actúa como chef profesional. Para el plato [Lasaña], 
    retorna un JSON con: nombre_receta, lista_ingredientes 
    (array con {nombre, cantidad, unidad}), pasos (array), 
    tiempo_estimado_minutos."
4. Lambda parsea el JSON, lo guarda en DynamoDB, retorna al cliente
5. Usuario asigna la receta a un día del calendario
```

### C. Scan & Cook (Computer Vision)
```
1. Usuario abre cámara o galería
2. Foto sube a S3 (presigned URL)
3. Lambda invoca OpenAI GPT-4o-mini con la URL de la imagen
4. Prompt: "Identifica todos los ingredientes visibles en esta 
   foto de refrigerador/despensa. Luego sugiere 3 recetas que 
   se puedan preparar con esos ingredientes. Retorna JSON con: 
   ingredientes_detectados[], recetas_sugeridas[{nombre, pasos[], 
   tiempo_estimado}]."
5. App muestra los 3 resultados con opción de guardar o planificar
```

### D. Lista de Compras Consolidada
```
1. Usuario abre "Lista de la semana"
2. Lambda consulta todas las entradas del calendario de esa semana
3. Obtiene los ingredientes de cada receta
4. Suma y agrupa por ingrediente (ej: "Tomate x 6 unidades")
5. Retorna checklist unificada, sin duplicados
```

---

## 5. Modelo de Negocio y Paywall

### Free Trial
- 7 días con acceso completo desde el registro
- Contado desde `trial_start` en DynamoDB

### Suscripción
- **$20 USD / año** vía RevenueCat (maneja App Store + Google Play)
- RevenueCat envía webhook a `POST /subscriptions/verify` al confirmar pago

### Funciones bloqueadas tras trial
| Función | Free Trial | Free (vencido) | Suscriptor |
|---|---|---|---|
| Crear hogar | ✅ | ✅ | ✅ |
| Unirse a hogar | ✅ | ❌ | ✅ |
| Sincronización familiar | ✅ | ❌ | ✅ |
| Generar recetas IA | ✅ | ❌ | ✅ |
| Scan & Cook | ✅ | ❌ | ✅ |
| Lista de compras | ✅ | ❌ | ✅ |

---

## 6. User Stories

| ID | Como... | Quiero... | Para... |
|---|---|---|---|
| US-01 | Admin del hogar | Invitar a mi hermano con un código | Que él también planifique sus comidas |
| US-02 | Usuario | Tomar foto a mis verduras olvidadas | Recibir ideas de cenas rápidas |
| US-03 | Encargado de compras | Ver lista consolidada semanal | No revisar receta por receta |
| US-04 | Usuario nuevo | Probar todas las funciones 7 días | Decidir si pago la suscripción |
| US-05 | Usuario | Escribir "Sushi" y obtener la receta completa | Saber qué comprar |

---

## 7. Fases de Desarrollo (MVP)

### Fase 1 — Setup y Auth (Semana 1-2)
- [ ] Configurar proyecto Expo (React Native)
- [ ] Configurar AWS: Cognito, API Gateway, Lambda, DynamoDB
- [ ] Pantallas: Registro, Login, Recuperar contraseña

### Fase 2 — Hogares y Calendario (Semana 3-4)
- [ ] Crear hogar y generar código de invitación
- [ ] Flujo de unirse al hogar
- [ ] Vista de calendario semanal compartido

### Fase 3 — IA: Generación de Recetas (Semana 5-6)
- [ ] Integración con Groq API (Lambda middleware)
- [ ] Pantalla de búsqueda de recetas
- [ ] Guardar receta y asignar a día del calendario

### Fase 4 — Lista de Compras (Semana 7)
- [ ] Algoritmo de consolidación de ingredientes
- [ ] Pantalla de checklist interactiva

### Fase 5 — Scan & Cook (Semana 8-9)
- [ ] Upload de imagen a S3
- [ ] Integración con OpenAI Vision
- [ ] Pantalla de resultados con 3 recetas sugeridas

### Fase 6 — Paywall (Semana 10)
- [ ] Integrar RevenueCat
- [ ] Lógica de trial de 7 días
- [ ] Bloqueo de funciones premium
- [ ] Pantalla de suscripción

### Fase 7 — QA y Publicación (Semana 11-12)
- [ ] Testing en dispositivos iOS y Android
- [ ] Publicar en App Store y Google Play
- [ ] Configurar CloudWatch para monitoreo

---

## 8. Estimación de Costos (Mensual, 1000 usuarios activos)

| Servicio | Estimado/mes |
|---|---|
| AWS Lambda + API Gateway | ~$5 |
| DynamoDB | ~$5 |
| S3 (fotos Scan & Cook) | ~$2 |
| Cognito | Gratis (hasta 50k MAU) |
| Groq API (texto) | ~$3 |
| OpenAI Vision (imágenes) | ~$10–20 |
| RevenueCat | Gratis (hasta $2.5k MRR) |
| **Total estimado** | **~$25–35 / mes** |

---

## 9. Consideraciones de Seguridad
- Todas las rutas de la API requieren JWT válido de Cognito
- Las imágenes en S3 solo son accesibles mediante presigned URLs con expiración de 15 minutos
- Los códigos de invitación expiran a las 48 horas
- Rate limiting en los endpoints de IA para evitar abuso

---

## 10. Requisitos para App Store (Apple) y Google Play

### Apple App Store

#### Técnico
- Compilar con **Xcode 16+** y **SDK iOS 18+**. Desde abril 2026 se requiere iOS/iPadOS 26 SDK.
- La app debe ser **completamente funcional** al momento de la revisión — sin crashes, links rotos ni pantallas incompletas.
- Apple rechaza apps que "se sienten a medias" (ej: botones que no hacen nada, secciones vacías).

#### Privacidad y Datos
- **Privacy Nutrition Labels** obligatorias en App Store Connect: declarar explícitamente qué datos se recopilan (email, fotos, uso de IA, identificadores de dispositivo).
- **Privacy Policy** accesible dentro de la app y en el listing de la App Store. Debe estar en una URL pública antes de subir la app.
- Las fotos del Scan & Cook deben tener un flujo claro de consentimiento: el usuario debe saber que la imagen se envía a un servicio externo (OpenAI).

#### IA (crítico para Yummeat)
- Declarar explícitamente en el onboarding que la app usa **servicios de IA de terceros** (Groq, OpenAI).
- No se puede ocultar que hay procesos automatizados detrás de las recetas o el análisis de fotos.
- Las apps de IA son revisadas con **mayor escrutinio** en 2026.

#### Suscripciones y Paywall
- **CRÍTICO**: En iOS, toda suscripción debe pasar por el sistema de **In-App Purchase (IAP)** de Apple — no se puede cobrar con Stripe directamente dentro de la app. RevenueCat es la solución correcta.
- El paywall **no puede tener "dark patterns"**: botón de cancelación visible, precio claro, sin texto confuso.
- Solo se permite **una oferta introductoria activa** a la vez: el trial de 7 días está bien, pero no se puede combinar con un descuento simultáneo.
- Comisión de Apple: **30%** estándar → baja a **15%** si los ingresos son menores a $1M/año (aplica al inicio).
- En **USA** (post-fallo Epic vs Apple, mayo 2025): se puede incluir un link a pagos externos, pero con reglas estrictas de implementación.

---

### Google Play

#### Técnico
- Las apps nuevas deben tener como target **Android 15 (API level 35)** como mínimo (desde agosto 2025).
- Solo se aceptan **archivos .aab (Android App Bundle)**, no APK.
- Cuenta de desarrollador: pago único de **$25 USD**.
- Desde **septiembre 2026**: solo apps de desarrolladores **verificados** se pueden instalar en Android en algunos países. Completar verificación de identidad en Play Console con anticipación.

#### IA
- Declarar en Play Console que la app usa **contenido generado por IA**.
- Incluir un mecanismo para que los usuarios **reporten respuestas inapropiadas** generadas por la IA (especialmente en Scan & Cook).

#### Suscripciones
- Google cobra **15% de comisión** desde el día 1 en suscripciones auto-renovables (mejor condición que Apple).
- Mayor flexibilidad que Apple para estructurar ofertas introductorias.
- Desde enero 2026: si la app puede ser usada por menores, usar la **Age Signals API** de Google para restricciones de acceso.

---

### Acciones Requeridas para Yummeat Antes de Publicar

| Área | Acción |
|---|---|
| **Fotos (Scan & Cook)** | Pedir permiso de cámara/galería con mensaje claro. Declarar en Privacy Labels que las imágenes se procesan via IA externa. |
| **IA externa (Groq/OpenAI)** | Pantalla de onboarding indicando el uso de servicios de IA de terceros y política de datos. |
| **Suscripción $20/año (iOS)** | Implementar únicamente via RevenueCat + IAP de Apple. Stripe solo como complemento web. |
| **Free Trial 7 días** | Apple: no combinar con descuento simultáneo. Una sola oferta introductoria activa. |
| **Privacy Policy** | Crear página web pública con la política de privacidad antes de subir a ambas tiendas. |
| **Paywall UX** | Botón de cancelación visible, precios claros, sin texto engañoso en ambas plataformas. |
| **Verificación Google** | Completar verificación de identidad en Play Console antes de septiembre 2026. |
| **Contenido IA reportable** | Agregar botón de "Reportar respuesta" en los resultados de Scan & Cook (requerido por Google Play). |
| **Age rating** | Declarar rating apropiado (4+ o E) ya que la app no tiene contenido para adultos. |

