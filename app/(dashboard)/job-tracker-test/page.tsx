"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  BookOpen,
  Edit2,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
} from "lucide-react"

interface Job {
  id: string
  title: string
  company: string
  location: string
  deadline?: string
  sessions: number
  coverColor: string
  initial: string
}

const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "TechCorp",
    location: "San Francisco, CA",
    deadline: "2024-04-15",
    sessions: 3,
    coverColor: "from-blue-500 to-purple-600",
    initial: "T",
  },
  {
    id: "2",
    title: "Full Stack Developer",
    company: "InnovateLabs",
    location: "Remote",
    deadline: "2024-03-30",
    sessions: 1,
    coverColor: "from-emerald-500 to-teal-600",
    initial: "I",
  },
  {
    id: "3",
    title: "Product Engineer",
    company: "CreativeStudio",
    location: "New York, NY",
    sessions: 0,
    coverColor: "from-orange-500 to-pink-600",
    initial: "C",
  },
  {
    id: "4",
    title: "Backend Engineer",
    company: "DataFlow",
    location: "Boston, MA",
    deadline: "2024-05-10",
    sessions: 2,
    coverColor: "from-indigo-500 to-blue-600",
    initial: "D",
  },
]

export default function JobTrackerTestPage() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id))
    setDeleteId(null)
  }

  const daysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diff = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diff
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
        aria-hidden
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Header Section */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-sans text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                Your Jobs
              </h1>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                Track and prepare for each role
              </p>
            </div>
            <Button asChild size="lg" className="w-full gap-2 rounded-lg py-6 px-6 font-semibold md:w-auto">
              <Link href="/job-upload">
                <Plus className="size-5" />
                Upload New Job
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {jobs.length === 0 ? (
            <Card className="border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <BookOpen className="mx-auto mb-4 size-12 text-slate-400" />
              <p className="text-lg text-slate-600 dark:text-slate-400">
                No jobs yet. Upload your first job to get started!
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/job-upload">Upload job</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => {
                const daysLeft = daysUntilDeadline(job.deadline)
                const isUrgent = daysLeft !== null && daysLeft <= 7

                return (
                  <Card
                    key={job.id}
                    className="group overflow-hidden border-slate-200 bg-white transition-shadow duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Cover */}
                    <div className="relative h-32 overflow-hidden bg-background">
                      <div
                        className={`absolute inset-0 bg-linear-to-br ${job.coverColor}`}
                        aria-hidden
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <span className="text-6xl font-bold text-white">
                          {job.initial}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="mb-1 line-clamp-2 text-lg font-bold text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      <p className="mb-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {job.company}
                      </p>

                      <div className="mb-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="size-4" />
                          {job.location}
                        </div>

                        {job.deadline && (
                          <div
                            className={`flex items-center gap-2 text-sm font-medium ${
                              isUrgent
                                ? "text-red-600 dark:text-red-400"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <Calendar className="size-4" />
                            {daysLeft} days left
                          </div>
                        )}

                        {job.sessions > 0 && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="size-4" />
                            {job.sessions}{" "}
                            {job.sessions === 1 ? "session" : "sessions"}
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      {job.sessions === 0 ? (
                        <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-900">
                          Not started
                        </Badge>
                      ) : job.sessions >= 3 ? (
                        <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-900">
                          Well prepared
                        </Badge>
                      ) : (
                        <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-900">
                          In progress
                        </Badge>
                      )}

                      {/* Action Buttons */}
                      <div className="mb-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                          asChild
                        >
                          <Link href={`/job-postings/${job.id}`}>
                            <BookOpen className="size-4" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          asChild
                        >
                          <Link href={`/job-postings/${job.id}`}>
                            <Edit2 className="size-4" />
                          </Link>
                        </Button>
                      </div>

                      {/* Practice Button */}
                      <Button
                        className="w-full gap-2 rounded-lg font-semibold transition-all group-hover:shadow-md"
                        size="sm"
                        asChild
                      >
                        <Link href="/sessions">
                          {job.sessions === 0
                            ? "Start Practice"
                            : "Continue Practice"}
                          <ChevronRight className="size-4" />
                        </Link>
                      </Button>

                      {/* Delete */}
                      <div className="mt-3 space-y-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteId((id) => (id === job.id ? null : job.id))
                          }
                          className="w-full rounded-lg py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          {deleteId === job.id ? "Cancel" : "Delete"}
                        </button>
                        {deleteId === job.id && (
                          <button
                            type="button"
                            onClick={() => handleDelete(job.id)}
                            className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                          >
                            Yes, delete this job
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      {jobs.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {jobs.length}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Total Jobs
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {jobs.reduce((sum, job) => sum + job.sessions, 0)}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Practice Sessions
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {jobs.filter((j) => j.deadline).length}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  With Deadlines
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
