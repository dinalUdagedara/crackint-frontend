"use client"

import SummaryView from "./summary-section/SummaryView"
import TitleSection from "./title-section/TitleSection"
import ReadinessDashboard from "./ReadinessDashboard"

const HomeView = () => {
  return (
    <div className="flex flex-col w-full min-w-0 px-3 py-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col min-w-0">
        <TitleSection />
        <div className="mt-3 sm:mt-4">
          <SummaryView />
        </div>
        <div className="mt-4 sm:mt-6">
          <ReadinessDashboard />
        </div>
      </div>
    </div>
  )
}

export default HomeView;