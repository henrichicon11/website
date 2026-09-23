import type { Context, MiddlewareHandler } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { AppEnv, SessionUser } from '../types'

const ITER = 100_000 // Cloudflare Workers caps PBKDF2 at 100k iterations
const SESSION_DAYS = 30
export const COOKIE = 'du_sid'

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const fromHex = (hex: string) => new Uint8Array(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)))

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  return toHex(bits)
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITER}$${toHex(salt)}$${await derive(password, salt, ITER)}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iter, saltHex, hashHex] = stored.split('$')
  if (scheme !== 'pbkdf2' || !saltHex || !hashHex) return false
  const candidate = await derive(password, fromHex(saltHex), parseInt(iter, 10))
  // constant-time compare
  if (candidate.length !== hashHex.length) return false
  let diff = 0
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ hashHex.charCodeAt(i)
  return diff === 0
}

export async function createSession(c: Context<AppEnv>, userId: number) {
  const id = toHex(crypto.getRandomValues(new Uint8Array(32)))
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5)
  await c.env.DB.prepare('INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)')
    .bind(id, userId, expires.toISOString())
    .run()
  setCookie(c, COOKIE, id, {
    path: '/', httpOnly: true, sameSite: 'Lax', secure: new URL(c.req.url).protocol === 'https:', expires
  })
}

export async function destroySession(c: Context<AppEnv>) {
  const sid = getCookie(c, COOKIE)
  if (sid) await c.env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(sid).run()
  deleteCookie(c, COOKIE, { path: '/' })
}

/** Loads the session user (if any) into c.var.user. */
export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set('user', null)
  const sid = getCookie(c, COOKIE)
  if (sid && /^[a-f0-9]{64}$/.test(sid)) {
    const row = await c.env.DB.prepare(
      `SELECT u.id,u.email,u.name,u.role,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=?`
    ).bind(sid).first<SessionUser & { expires_at: string }>()
    if (row && new Date(row.expires_at) > new Date()) {
      c.set('user', { id: row.id, email: row.email, name: row.name, role: row.role })
    } else if (row) {
      await c.env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(sid).run()
    }
  }
  await next()
}

/** Reject cross-site state-changing requests (defence in depth on top of SameSite=Lax). */
export const originGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('origin')
    if (origin) {
      const self = new URL(c.req.url)
      const fwdHost = c.req.header('x-forwarded-host') || c.req.header('host')
      let ok = false
      try {
        const o = new URL(origin)
        ok = o.host === self.host || o.host === fwdHost
      } catch { ok = false }
      if (!ok) return c.json({ error: 'Cross-origin request blocked' }, 403)
    }
  }
  await next()
}

export const requireUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('user')) {
    if (c.req.path.startsWith('/api/')) return c.json({ error: 'Sign in required' }, 401)
    return c.redirect('/login?next=' + encodeURIComponent(c.req.path))
  }
  await next()
}

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const u = c.get('user')
  if (!u || u.role !== 'admin') {
    if (c.req.path.startsWith('/api/')) return c.json({ error: 'Admin only' }, 403)
    return c.redirect('/login?next=' + encodeURIComponent(c.req.path))
  }
  await next()
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 200
