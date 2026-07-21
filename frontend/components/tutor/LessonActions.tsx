"use client";

import { motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { TutorAction } from "@/lib/ai/types";

interface LessonActionsProps {
  isLoading: boolean;
  onAction: (
    action: Exclude<TutorAction, "initial" | "followup" | "evaluate">,
  ) => void;
  onNewLesson: () => void;
}

const actions: Array<{
  action: Exclude<TutorAction, "initial" | "followup" | "evaluate">;
  label: string;
}> = [
  { action: "different", label: "Explain differently" },
  { action: "simpler", label: "Make it simpler" },
  { action: "example", label: "Give me an example" },
  { action: "challenge", label: "Challenge me" },
];

export function LessonActions({
  isLoading,
  onAction,
  onNewLesson,
}: LessonActionsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mt-6 flex flex-wrap items-center gap-2"
      aria-label="Lesson controls"
    >
      {actions.map(({ action, label }) => (
        <motion.div key={action} variants={staggerItem}>
          <Button
            type="button"
            color="tertiary"
            size="sm"
            isDisabled={isLoading}
            onClick={() => onAction(action)}
          >
            {label}
          </Button>
        </motion.div>
      ))}
      <motion.div variants={staggerItem}>
        <Button
          type="button"
          color="link-gray"
          size="sm"
          onClick={onNewLesson}
        >
          New topic
        </Button>
      </motion.div>
    </motion.div>
  );
}
