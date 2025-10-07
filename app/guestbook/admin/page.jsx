import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import GuestbookAdmin from '../../../components/GuestbookAdmin'
import { ADMIN_COOKIE_NAME, isAuthorizedByCookie } from '../../../lib/guestbook-auth'
import { readEntries } from '../../../lib/guestbook'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Guestbook Admin',
    description: 'Moderate guestbook doodles privately.'
}

export default async function GuestbookAdminPage() {
    const cookieStore = cookies()
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)

    if (!adminCookie || !isAuthorizedByCookie(adminCookie.value)) {
        notFound()
    }

    const entries = await readEntries()

    return <GuestbookAdmin entries={entries} />
}
