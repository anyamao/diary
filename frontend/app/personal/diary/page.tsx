// app/personal/diary/page.tsx
import { Suspense } from "react";
import DiaryContent from "./PersonalDiaryPage";

export default function DiaryPage() {
  return (
    <Suspense
      fallback={<div className="text-center py-8">Загрузка дневника...</div>}
    >
      <DiaryContent />
    </Suspense>
  );
}
