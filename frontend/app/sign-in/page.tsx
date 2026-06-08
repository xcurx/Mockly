import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GithubLogo, GoogleLogo, Lightning } from "@phosphor-icons/react/dist/ssr";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background px-4">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] opacity-50 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/20 rounded-full blur-[100px] opacity-50 mix-blend-screen pointer-events-none" />

      <Card className="w-full max-w-md border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl z-10 relative overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />
        
        <CardContent className="pt-10 pb-8 px-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto size-14 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-border/50 flex items-center justify-center rounded-2xl mb-4 shadow-inner">
              <Lightning weight="fill" className="size-7 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Mockly</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered mock interviews to help you land your dream job
            </p>
          </div>

          <div className="space-y-3">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                className="w-full h-11 relative overflow-hidden group bg-background/50 hover:bg-background border-border/50 hover:border-border transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <GoogleLogo weight="bold" className="mr-2 size-5" />
                Continue with Google
              </Button>
            </form>

            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                className="w-full h-11 relative overflow-hidden group bg-background/50 hover:bg-background border-border/50 hover:border-border transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <GithubLogo weight="fill" className="mr-2 size-5" />
                Continue with GitHub
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
