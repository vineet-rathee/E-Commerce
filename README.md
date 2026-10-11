# 🛒 E-Commerce Backend (Microservices Architecture)

A modular, scalable, and resilient e-commerce backend built using a **Microservices Architecture** with **Node.js**, **Express 5**, **MongoDB**, and **Redis**.

---

## 🏗️ Architecture Overview

The application is structured into decoupled microservices coordinated through a unified **API Gateway**:

```
                              [ Client / Frontend / Postman ]
                                             │
                                             ▼
                                  ┌────────────────────┐
                                  │    API Gateway     │ (Port 3000)
                                  └──────────┬─────────┘
                   ┌─────────────────────────┼─────────────────────────┐
                   ▼                         ▼                         ▼
         ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
         │   Auth Service   │      │ Product Service  │      │   Cart Service   │
         │   (Port 3001)    │      │   (Port 3002)    │      │   (Port 3003)    │
         └─────────┬────────┘      └─────────▲────────┘      └─────────▲────────┘
                   │                         │                         │
                   │                         └────────────┬────────────┘
                   │                                      │
                   └──────────────────┐                   │
                                      ▼                   ▼
                            ┌──────────────────────────────────┐
                            │          Order Service           │
                            │           (Port 3004)            │
                            └──────────────────────────────────┘
```

### Microservices Breakdown:

| Service | Port | Description & Responsibilities |
| :--- | :---: | :--- |
| **API Gateway** | `3000` | Single entry point reverse-proxying requests to downstream microservices using `express-http-proxy`. |
| **Auth Service** | `3001` | User registration, authentication, JWT token issuance, Redis session tracking, rate limiting, and delivery addresses. |
| **Product Service** | `3002` | Catalog management, product queries, seller CRUD operations, and atomic stock reservation/restoration. |
| **Cart Service** | `3003` | User-bound shopping carts, quantity adjustments, and pre-checkout stock availability validation. |
| **Order Service** | `3004` | Order checkout workflow, inventory deduction coordination, dynamic price calculation, cart clearing, and order cancellations. |

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Web Framework**: [Express 5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose 9](https://mongoosejs.com/)
- **Cache & Rate Limiting**: [Redis](https://redis.io/) via [ioredis](https://github.com/redis/ioredis)
- **Authentication**: JSON Web Tokens ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- **HTTP Proxy & Communication**: `express-http-proxy` and [Axios](https://axios-http.com/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a remote MongoDB Atlas URI
- **Redis** running locally (`redis://localhost:6379`)

---

### 1. Environment Setup

Copy the environment blueprint to create your configuration:

```bash
cp .env.example .env
```

Ensure the ports and connection strings match your local setup:

```env
# Gateway
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
CART_SERVICE_URL=http://localhost:3003
ORDER_SERVICE_URL=http://localhost:3004

# Auth Service
MONGO=mongodb://localhost:27017/ecom_auth
REDIS_URL=redis://localhost:6379
JWT=your_super_secret_jwt_key

# Product Service
MONGO=mongodb://localhost:27017/ecom_product

# Cart Service
MONGO=mongodb://localhost:27017/ecom_cart

# Order Service
MONGO=mongodb://localhost:27017/ecom_order
```

---

### 2. Install Dependencies

Install npm dependencies in each microservice directory:

```bash
cd gateway && npm install && cd ..
cd auth && npm install && cd ..
cd product && npm install && cd ..
cd cart && npm install && cd ..
cd order && npm install && cd ..
```

---

### 3. Running the Services

Open 5 terminal windows (or use a process manager like `concurrently` / `pm2`):

```bash
# Terminal 1: API Gateway (Port 3000)
cd gateway && npm run dev

# Terminal 2: Auth Service (Port 3001)
cd auth && npm run dev

# Terminal 3: Product Service (Port 3002)
cd product && npm run dev

# Terminal 4: Cart Service (Port 3003)
cd cart && npm run dev

# Terminal 5: Order Service (Port 3004)
cd order && npm run dev
```

---

## 📡 API Reference

All requests can be sent through the **API Gateway** (`http://localhost:3000`).

### 1. Auth Service (`/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/register` | Register a new user (`CUSTOMER`, `SELLER`, `ADMIN`) | ❌ |
| `POST` | `/auth/login` | Login and receive JWT cookie & token | ❌ |
| `GET` | `/auth/profile` | Get current user's profile | ✅ |
| `PATCH` | `/auth/update` | Update username, name, or email | ✅ |
| `POST` | `/auth/changePassword` | Change user password | ✅ |
| `POST` | `/auth/address` | Add delivery address with unique tag | ✅ |
| `GET` | `/auth/address/:tag` | Retrieve address by tag | ✅ |
| `DELETE` | `/auth/address/:tag` | Delete address by tag | ✅ |
| `POST` | `/auth/logout` | Revoke token session from Redis | ✅ |

### 2. Product Service (`/product`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/product/add` | Add a new product | ✅ (Seller) |
| `GET` | `/product/find/product/:id` | Get product details by ID | ❌ |
| `GET` | `/product/find/name/:name` | Search products by name | ❌ |
| `GET` | `/product/find/category?category=...` | Search products by category | ❌ |
| `GET` | `/product/find/user/:id` | Get all products by seller ID | ❌ |
| `PATCH` | `/product/updateStock/:id` | Update product inventory | ✅ (Seller) |
| `PATCH` | `/product/updatePrice/:id` | Update product price | ✅ (Seller) |
| `DELETE` | `/product/delete` | Delete product by name | ✅ (Seller) |

### 3. Cart Service (`/cart`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/cart/add` | Add or update product quantity (amount `0` removes item) | ✅ |
| `GET` | `/cart/` | View current user's shopping cart | ✅ |
| `DELETE` | `/cart/delete/:id` | Remove specific product from cart | ✅ |
| `DELETE` | `/cart/deleteCart` | Clear entire shopping cart | ✅ |

### 4. Order Service (`/order`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/order/create` | Checkout cart, reserve stock, calculate total, clear cart | ✅ |
| `GET` | `/order/my-orders` | View user's order history | ✅ |
| `GET` | `/order/:id` | Get specific order details | ✅ |
| `PATCH` | `/order/cancel/:id` | Cancel order and automatically restore product stock | ✅ |
| `PATCH` | `/order/status/:id` | Update order status (`SHIPPED`, `COMPLETED`, etc.) | ✅ (Admin/Seller) |

---

## 🧪 Postman Collection

A ready-to-import Postman collection is included in the root directory:
- **File**: [`ecommerce_postman_collection.json`](./ecommerce_postman_collection.json)

### Importing into Postman:
1. Open Postman $\rightarrow$ Click **Import**.
2. Select `ecommerce_postman_collection.json`.
3. The collection includes pre-configured tests that automatically capture and persist the JWT token (`{{token}}`), `{{userId}}`, `{{productId}}`, and `{{orderId}}` across your requests!

---

## 🔒 Key Design & Security Features

- **Hashed Passwords**: Password hashing using `bcrypt` with salting.
- **Data Privacy**: Passwords and sensitive hashes are scrubbed before sending API responses.
- **Atomic Inventory Updates**: Product stock is decremented and incremented using MongoDB atomic operations (`$inc` and `{ stock: { $gte: amount } }`) to prevent overselling race conditions.
- **Compensating Transactions (Rollback)**: If reserving any item fails during checkout, previously reserved items are automatically rolled back.
- **Redis Rate Limiting**: Built-in IP rate limiter in Auth to protect authentication endpoints from brute-force attacks.
- **Centralized Error Handling**: Express 5 error handling middleware in every service returning consistent JSON errors.

---
