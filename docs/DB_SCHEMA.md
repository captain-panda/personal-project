# Database Schema — MongoDB

Five collections. IDs are MongoDB `ObjectId`. All collections carry Mongoose
`createdAt`/`updatedAt` timestamps.

```
users 1───< user_sessions
users 1───< user_progress >───1 problems >───1 topics
```

---

## `users`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `email` | String | **unique**, lowercase, trimmed |
| `passwordHash` | String | bcrypt hash |
| `displayName` | String | |
| `lastLoginAt` | Date | |
| `revokeAfter` | Date \| null | instant-revocation epoch — access tokens with `iat` before this are rejected |
| `isActive` | Boolean | soft-disable / ban |

**Indexes:** `{ email: 1 }` unique · `{ createdAt: -1 }`

---

## `topics`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `name` | String | |
| `description` | String | |
| `order` | Number | display order |
| `slug` | String | **unique**, URL-safe |
| `iconUrl` | String | optional |

**Indexes:** `{ slug: 1 }` unique · `{ order: 1 }`

---

## `problems`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `topicId` | ObjectId → topics | |
| `subtopic` | String | e.g. "Sliding Window" |
| `title` | String | |
| `slug` | String | **unique** |
| `difficulty` | String | `Easy` \| `Medium` \| `Hard` |
| `description` | String | |
| `order` | Number | order within topic |
| `links` | Object | `{ youtube, leetcode, codeforces, article }` |
| `tags` | [String] | |

**Indexes:** `{ slug: 1 }` unique · `{ topicId: 1, order: 1 }` · `{ topicId: 1, difficulty: 1 }` · `{ difficulty: 1 }` · `{ tags: 1 }`

---

## `user_progress`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `userId` | ObjectId → users | |
| `problemId` | ObjectId → problems | |
| `completed` | Boolean | |
| `completedAt` | Date \| null | null when un-toggled |
| `notes` | String | optional personal notes |

**Indexes:** `{ userId: 1, problemId: 1 }` **unique** (upsert key) · `{ userId: 1, completed: 1 }` · `{ problemId: 1 }`

> `attempts` was intentionally dropped — toggling complete is not a meaningful
> "attempt" and it would make `PATCH` non-idempotent.

---

## `user_sessions`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `userId` | ObjectId → users | |
| `familyId` | String | groups rotations of one login (reuse detection) |
| `tokenHash` | String | **unique** — SHA-256 of the refresh token |
| `userAgent` | String | |
| `ipAddress` | String | |
| `expiresAt` | Date | **TTL index** — Mongo auto-purges expired sessions |
| `revokedAt` | Date \| null | set on rotation or revoke |

**Indexes:** `{ tokenHash: 1 }` unique · `{ userId: 1 }` · `{ familyId: 1 }` · `{ expiresAt: 1 }` TTL `expireAfterSeconds: 0`

---

## Design rationale
- **`user_progress` is a separate collection**, not embedded in `users` — per-user data grows unbounded and would hit the 16 MB document limit.
- **`{userId, problemId}` unique compound index** enables an atomic upsert with no pre-check query.
- **Topics/problems are separate, globally shared documents** — identical for every user, so they cache extremely well and keep Mongo read load low.
- **TTL on `user_sessions.expiresAt`** removes expired sessions automatically (no cron).
- **Refresh tokens are stored hashed** — a DB compromise can't replay them.
- **`slug` fields** give SEO-friendly URLs and avoid exposing raw ObjectIds.
