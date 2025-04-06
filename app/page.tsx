import VideoDownloader from '@/components/VideoDownloader'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
     <main className='flex  justify-center items-center h-screen'>
        <VideoDownloader/>
     </main>
  )
}
