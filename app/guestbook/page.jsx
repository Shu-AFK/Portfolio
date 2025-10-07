import Guestbook from '../../components/Guestbook'

export const metadata = {
    title: 'Guestbook',
    description: "Sign my guestbook with a fun doodle to say hello.",
    alternates: { canonical: 'https://floyd-dev.com/guestbook' },
    openGraph: {
        type: 'website',
        url: 'https://floyd-dev.com/guestbook',
        title: 'Guestbook | Floyd Göttsch',
        description: "Sign Floyd Göttsch's guestbook with a fun doodle to say hello.",
    },
}

export default function GuestbookPage() {
    return <Guestbook />
}
