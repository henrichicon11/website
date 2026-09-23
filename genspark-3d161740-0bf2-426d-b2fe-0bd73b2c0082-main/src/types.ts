export type Bindings = {
  DB: D1Database
}

export type SessionUser = {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
}

export type Variables = {
  user: SessionUser | null
}

export type AppEnv = { Bindings: Bindings; Variables: Variables }

export type Row = Record<string, any>
