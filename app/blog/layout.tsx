'use client'
import { ScrollProgress } from '@/components/ui/scroll-progress'


export default function LayoutBlogPost({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="pointer-events-none fixed left-0 top-0 z-10 h-12 w-full bg-gray-100 to-transparent backdrop-blur-xl [-webkit-mask-image:linear-gradient(to_bottom,black,transparent)] dark:bg-zinc-950" />
      <ScrollProgress
        className="fixed top-0 z-20 h-0.5 bg-gray-300 dark:bg-zinc-600"
        springOptions={{
          bounce: 0,
        }}
      />

      <main className="prose prose-gray mt-24 pb-20 prose-h4:prose-base dark:prose-invert prose-h1:text-xl prose-h1:font-medium prose-h2:mt-12 prose-h2:scroll-m-20 prose-h2:text-lg prose-h2:font-medium prose-h3:text-base prose-h3:font-medium prose-h4:font-medium prose-h5:text-base prose-h5:font-medium prose-h6:text-base prose-h6:font-medium prose-strong:font-medium">
        {children}
      </main>

      <footer className="mt-16 border-t border-gray-200 pt-8 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FACC6E] font-medium text-gray-600 dark:text-gray-300">
            RR
          </div>
          <div>
            <p className="text-sm font-medium">Rizky Ramadhani</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Linux Engineer · RHCSA · Azure Fundamentals · CompTIA A+
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
