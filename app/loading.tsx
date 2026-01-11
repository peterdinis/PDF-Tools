"use client"

import { LoadingOverlay } from "@/components/shared/LoadingOverlay"
import { FC } from "react"

const Loading: FC = () => {
    return <LoadingOverlay isVisible={true} />
}

export default Loading