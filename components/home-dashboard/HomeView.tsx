"use client"

import ChatInputView from "./chat-input/ChatInputView"
import SummaryView from "./summary-section/SummaryView"
import TitleSection from "./title-section/TitleSection"

const HomeView = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <TitleSection />
          <SummaryView />
        </div>
      </div>
      <ChatInputView />
    </div>
  )
}

export default HomeView;