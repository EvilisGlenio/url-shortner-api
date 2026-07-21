# URL Shortener

A personal study project for practicing backend development, software architecture, and System Design.

The application allows authenticated users to create short URLs, manage their links, define expiration dates, and view basic access analytics.

## Project Goal

The main goal is not only to build a URL shortener, but also to learn how to design a system before starting the implementation.

The project begins with an architecture designed for approximately 1,000 registered users and documents how the system could evolve to support a much larger scale.

## Initial Scope

The first version will allow users to:

* create an account;
* log in using email and password;
* create short links;
* use an automatically generated short code;
* define a custom short code;
* edit the destination URL;
* define an optional expiration date;
* activate or deactivate links;
* delete links;
* view the total number of clicks;
* view clicks grouped by day;
* view basic information about recent accesses.

Each user can only manage their own links.

## Out of Scope

The initial version will not include:

* paid plans;
* social login;
* custom domains;
* password recovery;
* geolocation by IP;
* unique visitor detection;
* advanced bot detection;
* real-time analytics;
* microservices;
* distributed infrastructure.

## Initial Scale

The first version is designed for:

* up to 1,000 registered users;
* approximately 100 daily active users;
* an average of 20 links per user;
* approximately 20,000 stored links;
* approximately 10,000 redirects per day;
* estimated traffic peaks of up to 10 requests per second.

This scale can be supported by a single backend application and a single PostgreSQL database.

## Architecture

The initial architecture will use a modular monolith.

```text
Client
   |
   v
NestJS API
   |
   v
PostgreSQL
```

The backend will be divided into modules with clear responsibilities:

```text
src/
├── auth/
├── users/
├── short-links/
├── redirect/
└── analytics/
```

### Modules

* `Auth`: registration, login, authentication, and authorization.
* `Users`: user data and user-related rules.
* `Short Links`: link creation, editing, expiration, activation, and deletion.
* `Redirect`: short-code resolution and HTTP redirection.
* `Analytics`: click registration and analytics queries.

## Main Domain Entities

### User

Represents an authenticated user who owns and manages short links.

Main fields:

* `id`
* `name`
* `email`
* `passwordHash`
* `createdAt`
* `updatedAt`

### Short Link

Represents a short code associated with a destination URL.

Main fields:

* `id`
* `userId`
* `shortCode`
* `originalUrl`
* `totalClicks`
* `isActive`
* `expiresAt`
* `createdAt`
* `updatedAt`

### Click Event

Represents a successful access to a short link.

Main fields:

* `id`
* `shortLinkId`
* `clickedAt`
* `referer`
* `userAgent`
* `ipHash`

## Main Business Rules

* User emails must be unique.
* Short codes must be globally unique.
* A short code may be generated automatically.
* Users may provide a custom short code.
* The short code cannot be changed after creation.
* The destination URL may be changed.
* Expiration is optional.
* An expiration date must be in the future.
* Expired or disabled links must not redirect.
* Invalid, expired, or disabled accesses must not count as clicks.
* Every successful redirect counts as a click.
* Repeated clicks are counted.
* Analytics failures must not prevent the redirection.
* Users can only access and manage their own links.

## Main Flows

### Create a short link

```text
Authenticated user
        |
        v
Submit destination URL
        |
        v
Validate input
        |
        v
Validate or generate short code
        |
        v
Save link
        |
        v
Return short URL
```

### Redirect

```text
Visitor accesses /:shortCode
        |
        v
Find short link
        |
        v
Validate active status
        |
        v
Validate expiration
        |
        v
Request click registration
        |
        v
Redirect to destination URL
```

Analytics processing should not block the redirect response.

## Expected Technology Stack

The initial implementation is expected to use:

* Node.js
* TypeScript
* NestJS
* PostgreSQL
* TypeORM
* Docker
* JWT authentication

Redis and a message queue may be introduced later if performance or reliability requirements justify them.

## Migrations

Create an empty migration:

```bash
npm run migration:create -- src/database/migrations/<migration-name>
```

Generate a migration from entity changes:

```bash
npm run migration:generate -- src/database/migrations/<migration-name>
```

Run all pending migrations:

```bash
npm run migration:run
```

Show the status of all migrations:

```bash
npm run migration:show
```

Revert the most recently applied migration:

```bash
npm run migration:revert
```

## Possible Initial API

```http
POST /auth/register
POST /auth/login
GET  /auth/me

POST   /links
GET    /links
GET    /links/:id
PATCH  /links/:id
DELETE /links/:id

PATCH /links/:id/activate
PATCH /links/:id/deactivate

GET /links/:id/analytics

GET /:shortCode
```

The API structure may change during the design and implementation process.

## Development Stages

The project will be implemented incrementally.

### Stage 1 — Foundation

* create the NestJS project;
* configure PostgreSQL;
* configure Docker;
* create the user entity;
* implement registration;
* implement authentication.

### Stage 2 — Short links

* create short links;
* generate short codes;
* support custom codes;
* list links owned by the user.

### Stage 3 — Redirect

* resolve short codes;
* validate active and expired links;
* return HTTP redirects;
* handle unavailable links.

### Stage 4 — Link management

* edit destination URLs;
* activate links;
* deactivate links;
* delete links.

### Stage 5 — Analytics

* register click events;
* increment click counters;
* show total clicks;
* show clicks grouped by day;
* show recent accesses.

### Stage 6 — Reliability

* add rate limiting;
* improve logs;
* handle analytics failures;
* add automated tests;
* run basic load tests.

## Current Status

The project is currently in the architecture and planning stage.

No implementation has been started yet.

The next steps are:

1. finalize the domain model;
2. define the first API contracts;
3. document important architectural decisions;
4. create the implementation plan;
5. start the project foundation.
