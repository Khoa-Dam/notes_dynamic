import { Features } from './components/features'
import { Hero } from './components/hero'
import { Stats } from './components/stats'
import { TechStack } from './components/tech-stack'

export default function HomePage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Hero />
      <Stats />
      <Features />
      <TechStack />
    </div>
  )
}
