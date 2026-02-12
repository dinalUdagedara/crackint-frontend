"use client"

import SummaryView from "./summary-section/SummaryView"
import TitleSection from "./title-section/TitleSection"

const HomeView = () => {
  return (
    <div className="flex flex-col w-full p-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <TitleSection />
        <SummaryView />
      </div>
    </div>
  )
}

export default HomeView;