import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkSimple, Target, Clock, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BookmarkButton } from "@/components/dashboard/bookmark-button";
import { StartReviewButton } from "@/components/dashboard/start-review-button";

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const bookmarkedExchanges = await prisma.interviewExchange.findMany({
    where: {
      bookmarked: true,
      interview: {
        userId: session.user.id,
      },
    },
    include: {
      interview: {
        select: {
          topics: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookmarkSimple weight="fill" className="size-6 text-primary" />
            Bookmarked Questions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Questions you've saved for review. Revisit them to strengthen your weak areas.
          </p>
        </div>

        {bookmarkedExchanges.length > 0 && (
          <StartReviewButton 
            questions={bookmarkedExchanges.map((ex) => ex.question)} 
          />
        )}
      </div>

      {bookmarkedExchanges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/50 rounded-xl bg-muted/10">
          <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <BookmarkSimple weight="duotone" className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No bookmarks yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Save difficult questions from your interview results to review them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarkedExchanges.map((exchange) => (
            <Card key={exchange.id} className="border-border/50 overflow-hidden">
              <CardHeader className="p-4 pb-2 bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {new Date(exchange.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {exchange.interview.topics.slice(0, 2).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] py-0">{t}</Badge>
                    ))}
                  </div>
                </div>
                <BookmarkButton 
                  interviewId={exchange.interviewId}
                  exchangeId={exchange.id}
                  initialBookmarked={exchange.bookmarked}
                />
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-sm font-medium leading-relaxed">
                  {exchange.question}
                </p>
                {exchange.userAnswer && (
                  <div className="mt-4 pl-3 border-l-2 border-muted">
                    <p className="text-xs text-muted-foreground mb-1">Your previous answer:</p>
                    <p className="text-sm text-foreground/80 line-clamp-2 italic">
                      "{exchange.userAnswer}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
