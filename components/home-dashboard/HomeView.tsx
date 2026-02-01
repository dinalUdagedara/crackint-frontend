"use client"

import SummaryView from "./summary-section/SummaryView"

const HomeView = () => {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <SummaryView />
        </div>
    )
}

export default HomeView;