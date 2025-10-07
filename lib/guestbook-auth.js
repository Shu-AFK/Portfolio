import { createHash, timingSafeEqual } from 'crypto'

export const ADMIN_COOKIE_NAME = 'guestbook-admin'

function getAdminToken() {
    return process.env.GUESTBOOK_ADMIN_TOKEN || ''
}

export function getHashedAdminToken() {
    const token = getAdminToken()
    if (!token) {
        return ''
    }

    return createHash('sha256').update(token).digest('hex')
}

export function safeCompareStrings(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false
    }

    const bufferA = Buffer.from(a)
    const bufferB = Buffer.from(b)

    if (bufferA.length !== bufferB.length) {
        return false
    }

    return timingSafeEqual(bufferA, bufferB)
}

export function isAuthorizedByToken(token) {
    const adminToken = getAdminToken()
    if (!adminToken) {
        return false
    }

    return safeCompareStrings(token, adminToken)
}

export function isAuthorizedByCookie(cookieValue) {
    const expected = getHashedAdminToken()
    if (!expected) {
        return false
    }

    return safeCompareStrings(cookieValue, expected)
}
