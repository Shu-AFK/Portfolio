import { readEntries, writeEntries } from '../../../../lib/guestbook'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, isAuthorizedByCookie, isAuthorizedByToken } from '../../../../lib/guestbook-auth'

const ADMIN_TOKEN = process.env.GUESTBOOK_ADMIN_TOKEN

function isRequestAuthorized(request) {
    const authHeader = request.headers.get('authorization') || ''
    const providedToken = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (providedToken && isAuthorizedByToken(providedToken)) {
        return true
    }

    const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    if (cookieValue && isAuthorizedByCookie(cookieValue)) {
        return true
    }

    return false
}

export async function DELETE(request, { params }) {
    if (!params?.id) {
        return NextResponse.json({ error: 'Guestbook entry not found.' }, { status: 404 })
    }

    if (!ADMIN_TOKEN) {
        return NextResponse.json({ error: 'Guestbook moderation is not configured.' }, { status: 500 })
    }

    if (!isRequestAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const entries = await readEntries()
    const index = entries.findIndex(entry => entry.id === params.id)

    if (index === -1) {
        return NextResponse.json({ error: 'Guestbook entry not found.' }, { status: 404 })
    }

    entries.splice(index, 1)
    await writeEntries(entries)

    return NextResponse.json({ success: true }, { status: 200 })
}
