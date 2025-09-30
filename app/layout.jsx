import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export const metadata = {
    title: 'Floyd Göttsch',
    description: 'C++ & Go. Making things that work.'
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className="bg-white text-black dark:bg-[#070607] dark:text-white font-sans flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-14">
            {children}
        </main>
        <Footer />
        </body>
        </html>
    )
}
