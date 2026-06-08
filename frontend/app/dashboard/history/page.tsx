import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { InterviewCard } from "@/components/dashboard/stats-and-cards";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";

export default async function HistoryPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const interviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { exchanges: { select: { id: true } } },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
          <ClockCounterClockwise weight="duotone" className="size-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Interview History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review your past mock interviews and track your progress
          </p>
        </div>
      </div>

      {interviews.length > 0 ? (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/50 rounded-xl bg-card/50">
          <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <ClockCounterClockwise weight="duotone" className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No history yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Your completed and abandoned interviews will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
