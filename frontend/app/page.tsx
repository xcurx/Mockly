import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lightning, RocketLaunch, ChatTeardropText, Browser } from "@phosphor-icons/react/dist/ssr";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 -left-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="w-full border-b border-border/40 bg-background/50 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Lightning weight="fill" className="size-6 text-purple-500" />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Mockly
            </span>
          </div>
          <Link href="/sign-in">
            <Button variant="secondary" className="font-semibold px-6 rounded-full border border-border/50 bg-background/50 backdrop-blur-md hover:bg-muted">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center relative z-10">
        <Badge variant="outline" className="mb-6 py-1 px-3 border-purple-500/30 bg-purple-500/10 text-purple-300 gap-1.5 rounded-full">
          <RocketLaunch weight="fill" className="size-3.5" />
          The smartest way to prep
        </Badge>
        
        <h1 className="max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          Ace your next interview with <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Agentic AI
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
          Upload your resume, pick your tech stack, and let Mockly research the web to ask you real, relevant, and challenging questions.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/sign-in">
            <Button size="lg" className="h-14 px-8 text-base rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 transition-opacity gap-2 border-0 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
              Start Practicing Free
              <Lightning weight="bold" className="size-4" />
            </Button>
          </Link>
          <Link href="https://github.com/xcurx/Mockly" target="_blank">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-border/50 bg-background/50 hover:bg-muted transition-colors gap-2">
              <Browser weight="duotone" className="size-5" />
              View on GitHub
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-5xl mx-auto text-left">
          <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="size-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <Browser weight="duotone" className="size-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Web Research</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Our AI scours the web for the most recent and relevant questions for your specific tech stack.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="size-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <ChatTeardropText weight="duotone" className="size-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Resume Context</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Upload your resume and get questions tailored specifically to your past experience and projects.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="size-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Lightning weight="duotone" className="size-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Detailed Feedback</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Get an instant evaluation on your answers, highlighting your strengths and areas to improve.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Badge({ children, className, variant }: any) {
  return <div className={`inline-flex items-center text-xs font-semibold ${className}`}>{children}</div>;
}
