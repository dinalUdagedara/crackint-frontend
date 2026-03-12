"use client"

import SummaryView from "./summary-section/SummaryView"
import TitleSection from "./title-section/TitleSection"
import ReadinessDashboard from "./ReadinessDashboard"

const HomeView = () => {
  return (
    <div className="flex flex-col w-full p-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <TitleSection />
        <div className="mt-4">
          <SummaryView />
        </div>
        <div className="mt-6">
          <ReadinessDashboard />
        </div>
      </div>
    </div>
  )
}

export default HomeView;