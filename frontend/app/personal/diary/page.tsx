import { Suspense } from "react";
import DiaryContent from "./PersonalDiaryPage";

export default function DiaryPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-8 w-full bg-pink-60 min-h-[950px]">
          Загрузка дневника...
        </div>
      }
    >
      <DiaryContent />
    </Suspense>
  );
}
