-- CreateEnum
CREATE TYPE "DifficultyMode" AS ENUM ('ADAPTIVE', 'MANUAL');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('INTERN', 'JUNIOR', 'MID', 'SENIOR', 'STAFF');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InterviewMode" ADD VALUE 'REVIEW';
ALTER TYPE "InterviewMode" ADD VALUE 'BEHAVIORAL';

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "difficultyMode" "DifficultyMode" NOT NULL DEFAULT 'ADAPTIVE',
ADD COLUMN     "interviewState" JSONB,
ADD COLUMN     "manualDifficulty" INTEGER,
ADD COLUMN     "role" "ExperienceLevel",
ADD COLUMN     "timeLimitSeconds" INTEGER;

-- AlterTable
ALTER TABLE "InterviewExchange" ADD COLUMN     "bookmarked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hints" TEXT[] DEFAULT ARRAY[]::TEXT[];
