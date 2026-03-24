import { Suspense } from 'react'
import { HomeHeader } from '@/components/home-header'
import { Footer } from '@/components/footer'
import SecaoConversao from '@/components/sections/SecaoConversao'
import { HeroSection } from '@/components/home/HeroSection'
import { BenefitsSection } from '@/components/home/BenefitsSection'
import { ProductSection } from '@/components/home/ProductSection'
import { NichesSection } from '@/components/home/NichesSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { FinalCtaSection } from '@/components/home/FinalCtaSection'

export default function Home() {
  return (
    <>
      <main className="bg-background text-foreground min-h-screen">
        <Suspense fallback={null}>
          <HomeHeader />
        </Suspense>
        <HeroSection />
        <BenefitsSection />
        <ProductSection />
        <NichesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecaoConversao />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  )
}
