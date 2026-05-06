// ─── User ───────────────────────────────────────────────
export interface UserPublic {
  username: string
  email: string
  user_id: number
  level: number
}

export interface UserCreate {
  username: string
  email: string
  password: string
  level: number
}

export interface UserUpdate {
  email?: string | null
  password?: string | null
}

export interface UserProfilePublic {
  user_id: number
  birthday: string | null
  age: number | null
  bio: string | null
  avatar_url: string | null
}

export interface UserProfileUpdate {
  birthday?: string | null
  age?: number | null
  bio?: string | null
  avatar_url?: string | null
}

// ─── Article ────────────────────────────────────────────
export interface ArticleList {
  title: string | null
  create_time: string
  author_id: number | null
  article_id: number | null
  tags: string | null
  alive: boolean
}

export interface ArticlePublic {
  title: string | null
  create_time: string
  author_id: number | null
  body: string | null
  tags: string | null
}

export interface ArticleCreate {
  title: string
  body: string
  tags: string
}

export interface ArticleUpdate {
  title?: string | null
  body?: string | null
  tags?: string | null
}

// ─── Checki ────────────────────────────────────────────
export interface CheckiCount {
  name: string | null
  cheki_count: number | null
  id: number | null
}

export interface CheckiCreate {
  name: string
  cheki_count: number
}

export interface CheckiUpdate {
  cheki_count: number
}

// ─── Auth ───────────────────────────────────────────────
export interface Token {
  access_token: string
  token_type: string
}
