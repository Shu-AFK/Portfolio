import dynamic from 'next/dynamic'

const BeatMaker = dynamic(() => import('../../components/BeatMaker'), { ssr: false })

export const metadata = {
    title: 'Beatmaker',
    description: 'Layer drum samples and experiment with the built-in synth pattern generator.'
}

export default function BeatMakerPage() {
    return <BeatMaker />
}
