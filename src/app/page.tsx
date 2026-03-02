import HomeClient from '@/components/home/HomeClient';
import TrustedSection from '@/components/home/TrustedSection';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <HomeClient trustedSection={<TrustedSection />} />;
}
