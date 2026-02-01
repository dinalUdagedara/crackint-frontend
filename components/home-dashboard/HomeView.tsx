"use client"

import SummaryView from "./summary-section/SummaryView"
import TitleSection from "./title-section/TitleSection"

const HomeView = () => {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <TitleSection />
            <SummaryView />
        </div>
    )
}

export default HomeView;