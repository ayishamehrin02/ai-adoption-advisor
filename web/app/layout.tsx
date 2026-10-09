import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'AI Adoption Advisor', description: 'Turn everyday workflows into a clear, explainable AI adoption plan.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
