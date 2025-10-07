import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, getHashedAdminToken, isAuthorizedByToken } from '../../../../../lib/guestbook-auth'

const ADMIN_TOKEN = process.env.GUESTBOOK_ADMIN_TOKEN

export async function POST(request) {
    if (!ADMIN_TOKEN) {
        return NextResponse.json({ error: 'Guestbook moderation is not configured.' }, { status: 500 })
    }

    const body = await request.json().catch(() => null)
    const token = typeof body?.token === 'string' ? body.token.trim() : ''

    if (!token) {
        return NextResponse.json({ error: 'An admin token is required.' }, { status: 400 })
    }

    if (!isAuthorizedByToken(token)) {
        return NextResponse.json({ error: 'Invalid admin token.' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true }, { status: 200 })
    response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: getHashedAdminToken(),
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30
    })

    return response
}

export function DELETE() {
    const response = NextResponse.json({ success: true }, { status: 200 })
    response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: '',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0
    })

    return response
}
