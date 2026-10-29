export default function BlackHole({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative flex flex-col items-center h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 animate-iteration-count-infinite animate-pulsing animate-duration-5000"
        style={{
          backgroundImage: `radial-gradient(circle at bottom, #000000 40%, #3b3a3a 55%, #000 80%)`,
        }}
      />
      {children}
    </section>
  )
}
