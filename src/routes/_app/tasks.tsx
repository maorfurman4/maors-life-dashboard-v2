import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare, Plus } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DailyBrief } from "@/components/productivity/DailyBrief";
import { TaskList } from "@/components/productivity/TaskList";
import { KanbanView } from "@/components/productivity/KanbanView";
import { ProgressChart } from "@/components/productivity/ProgressChart";
import { TaskAddDrawer } from "@/components/productivity/TaskAddDrawer";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">משימות</h1>
            <p className="text-xs text-muted-foreground">ניהול משימות ופרויקטים</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 ml-1" />
          הוסף משימה
        </Button>
      </div>

      <DailyBrief />
      <ProgressChart />

      <Tabs defaultValue="list" dir="rtl">
        <TabsList className="w-full">
          <TabsTrigger value="list" className="flex-1">
            רשימה
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex-1">
            קנבן
          </TabsTrigger>
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
