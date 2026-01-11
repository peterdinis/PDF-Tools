"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface LoadingStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "success" | "error";
  progress?: number;
}

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  steps?: LoadingStep[];
  currentStepIndex?: number;
  totalProgress?: number;
  onCancel?: () => void;
}

export const LoadingOverlay = ({
  isVisible,
  title = "Processing PDF",
  subtitle = "Please wait while we process your document...",
  steps = [],
  currentStepIndex = 0,
  totalProgress = 0,
  onCancel,
}: LoadingOverlayProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl border bg-card p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
              >
                <FileText className="h-6 w-6 text-primary" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>

            {/* Progress Bar */}
            {totalProgress > 0 && (
              <div className="mb-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Overall Progress
                  </span>
                  <span className="font-medium text-foreground">
                    {Math.round(totalProgress)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${totalProgress}%` }}
                    transition={{ type: "spring", damping: 30 }}
                    className="h-full rounded-full bg-linear-to-r from-primary to-primary/70"
                  />
                </div>
              </div>
            )}

            {/* Steps */}
            {steps.length > 0 && (
              <div className="mb-6 space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 rounded-lg p-3 ${
                      index === currentStepIndex
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-muted/30"
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="flex h-8 w-8 items-center justify-center">
                      {step.status === "pending" && (
                        <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      {step.status === "loading" && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Loader2 className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}
                      {step.status === "success" && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {step.status === "error" && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {step.label}
                      </p>
                      {step.progress !== undefined && (
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: `${step.progress}%` }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Animated Dots */}
            {!steps.length && (
              <div className="mb-6 flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Cancel Button */}
            {onCancel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
