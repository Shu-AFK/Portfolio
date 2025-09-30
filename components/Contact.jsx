'use client'
import { Mail, Github, Linkedin } from 'lucide-react'

export default function Contact() {
    return (
        <section id="contact" className="py-12">
            <h2 className="text-3xl font-semibold mb-8 text-left relative inline-block">
        <span className="relative inline-block pr-2">
          Contact
          <span className="absolute bottom-0 left-0 w-[84%] h-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"></span>
        </span>
            </h2>

            <p className="max-w-3xl mb-4 text-left text-lg leading-relaxed">
                Whether it’s an interesting project, a new idea, or just a quick hello,
                I’d love to hear from you. Feel free to reach out through email or
                connect with me on GitHub and LinkedIn.
            </p>

            <p className="flex items-center space-x-2 text-lg font-medium mb-8">
                <Mail className="w-5 h-5 text-violet-600" />
                <a
                    href="mailto:floyd.goettsch1@gmail.com"
                    className="text-violet-600 hover:underline"
                >
                    floyd.goettsch1@gmail.com
                </a>
            </p>

            <div className="flex space-x-8">
                <a
                    href="https://github.com/Shu-AFK"
                    target="_blank"
                    className="flex items-center space-x-2 hover:text-violet-600 transition-colors"
                >
                    <Github className="w-5 h-5" />
                    <span>GitHub</span>
                </a>

                <a
                    href="https://www.linkedin.com/in/floyd-goettsch-014718215/"
                    target="_blank"
                    className="flex items-center space-x-2 hover:text-violet-600 transition-colors"
                >
                    <Linkedin className="w-5 h-5" />
                    <span>LinkedIn</span>
                </a>
            </div>
        </section>
    )
}
