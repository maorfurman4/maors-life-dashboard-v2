import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyBrief } from "@/components/productivity/DailyBrief";
import { TaskList } from "@/components/productivity/TaskList";
import { KanbanView } from "@/components/productivity/KanbanView";
import { ProgressChart } from "@/components/productivity/ProgressChart";
import { TaskAddDrawer } from "@/components/productivity/TaskAddDrawer";
import { TaskFastAdd } from "@/components/productivity/TaskFastAdd";
import { TaskMotivationAgent } from "@/components/productivity/TaskMotivationAgent";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ letterSpacing: 0 }}>משימות</h1>
            <p className="text-xs text-muted-foreground">ניהול חכם · AI מוטיבציה · קלנדר</p>
          </div>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="text-xs text-primary font-semibold hover:underline min-h-[32px]"
        >
          + מורחב
        </button>
      </div>

      {/* Always-visible inline fast-add — zero friction */}
      <TaskFastAdd />

      {/* Daily brief + Google Calendar */}
      <DailyBrief />

      {/* Weekly progress bars */}
      <ProgressChart />

      {/* AI pattern analysis + dugri motivation */}
      <TaskMotivationAgent />

      {/* Task views */}
      <Tabs defaultValue="list" dir="rtl">
        <TabsList className="w-full">
          <TabsTrigger value="list" className="flex-1">רשימה</TabsTrigger>
          <TabsTrigger value="kanban" className="flex-1">קנבן</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <TaskList />
        </TabsContent>
        <TabsContent value="kanban" className="mt-4">
          <KanbanView />
        </TabsContent>
      </Tabs>

      <TaskAddDrawer open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
