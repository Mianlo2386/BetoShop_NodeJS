# BetoShop API Endpoints Specification

## Base URL
```
/api
```

---

## 📦 Productos

### GET /api/productos
Obtiene todos los productos.

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Zapatilla Nike",
    "descripcion": "Descripción del producto",
    "precio": 150.00,
    "imagenUrl": "/img/producto.jpg",
    "categoria": "Calzado",
    "subcategoria": "Deportivo",
    "stock": 10,
    "stars": 4,
    "size": "42",
    "releaseDate": "2024-01-15"
  }
]
```

### GET /api/productos/{id}
Obtiene un producto por ID.

**Parámetros:**
- `id` (path) - ID del producto

**Respuesta (200):**
```json
{
  "id": 1,
  "nombre": "Zapatilla Nike",
  "precio": 150.00
}
```

**Respuesta (404):** Producto no encontrado

### POST /api/productos
Crea un nuevo producto. Requiere rol ADMIN.

**Auth:** Bearer Token (ADMIN)

**Request Body:**
```json
{
  "nombre": "Nuevo Producto",
  "descripcion": "Descripción",
  "precio": 100.00,
  "categoria": "Calzado",
  "stock": 20
}
```

**Respuesta (201):**
```json
{
  "id": 5,
  "nombre": "Nuevo Producto"
}
```

### DELETE /api/productos/{id}
Elimina un producto. Requiere rol ADMIN.

**Auth:** Bearer Token (ADMIN)

**Respuesta (200):** Eliminado exitosamente

---

## 👤 Usuarios

### GET /api/usuarios
Lista todos los usuarios. Requiere rol ADMIN.

**Auth:** Bearer Token (ADMIN)

**Respuesta:**
```json
[
  {
    "id": 1,
    "username": "usuario1",
    "email": "usuario@email.com",
    "roles": ["ROLE_USER"]
  }
]
```

### POST /api/usuarios
Crea un nuevo usuario. Requiere rol ADMIN.

**Auth:** Bearer Token (ADMIN)

**Request Body:**
```json
{
  "username": "nuevousuario",
  "email": "nuevo@email.com",
  "password": "contraseña123"
}
```

**Respuesta (201):**
```json
{
  "id": 2,
  "username": "nuevousuario",
  "email": "nuevo@email.com"
}
```

---

## 🔐 Autenticación

### POST /api/auth/login
Inicia sesión de usuario.

**Request Body:**
```json
{
  "username": "usuario",
  "password": "contraseña"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "usuario",
    "email": "usuario@email.com",
    "roles": ["ROLE_USER"]
  }
}
```

**Cookies Establecidas:**
- `accessToken` - HttpOnly, Secure, SameSite=Strict, Max-Age=15min
- `refreshToken` - HttpOnly, Secure, SameSite=Strict, Max-Age=7d

**Respuesta (401):** Credenciales inválidas

> **⚠️ Regla de Seguridad:** Prohibido almacenar tokens en LocalStorage. Uso obligatorio de Cookies HttpOnly para persistencia de sesión.

### POST /api/auth/register
Registra un nuevo usuario.

**Request Body:**
```json
{
  "username": "nuevousuario",
  "email": "email@email.com",
  "password": "contraseña123"
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "username": "nuevousuario",
    "email": "email@email.com"
  }
}
```

---

## 🛒 Carrito

### POST /cart/add
Agrega producto al carrito.

**Parámetros:**
- `productId` (form)
- `quantity` (form)
- `submit` (form): "addtocard" o "buy"

**Respuesta:** Redirect a /cart o /checkout

### GET /cart
Muestra el carrito.

**Respuesta:**
```json
{
  "items": [
    {
      "producto": {
        "id": 1,
        "nombre": "Producto",
        "precio": 100.00
      },
      "quantity": 2
    }
  ]
}
```

### POST /cart/delete
Elimina producto del carrito.

**Parámetros:**
- `productId` (form)

**Respuesta:** Redirect a /cart

---

## 🎁 Promociones

### GET /api/promociones
Lista promociones activas.

**Respuesta:**
```json
[
  {
    "id": 1,
    "title": "Descuento 20%",
    "description": "En todos los productos",
    "type": "BANNER",
    "discountPercentage": 20,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
]
```

---

## 📋 Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔒 Roles

| Rol | Permisos |
|-----|----------|
| ROLE_USER | Ver productos, carrito, comprar |
| ROLE_ADMIN | + Crear/editar/eliminar productos, usuarios |

---

## 🛡️ Políticas de Seguridad

### Gestión de Sesión
- **Prohibido:** Almacenamiento de tokens en LocalStorage
- **Obligatorio:** Cookies HttpOnly para persistencia de sesión
- **Atributos de Cookie:**
  - `HttpOnly` - Previene acceso desde JavaScript (XSS)
  - `Secure` - Solo HTTPS
  - `SameSite=Strict` - Previene CSRF
  - `Max-Age` - Expiración automática

### Flujo de Autenticación
1. Usuario envía credenciales a `/api/auth/login`
2. Servidor valida credenciales y genera tokens JWT
3. Servidor establece cookies HttpOnly con los tokens
4. Cliente envía cookies automáticamente en cada请求
5. Servidor valida token de acceso (15 min) y refresca con refreshToken (7 días)

### Rate Limiting
- Login: 5 intentos por 15 minutos
- Registro: 5 intentos por hora
- Recuperación password: 3 intentos por hora
