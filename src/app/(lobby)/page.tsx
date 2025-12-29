import { Features } from './components/features'
import { Hero } from './components/hero'
import { Stats } from './components/stats'
import { TechStack } from './components/tech-stack'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <TechStack />
    </>
  )
}
