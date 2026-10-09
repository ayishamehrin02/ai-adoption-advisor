import { z } from 'zod';

export const taskTypes = ['classification', 'extraction', 'summarization', 'drafting', 'reasoning', 'other'] as const;
export const sensitivities = ['none', 'personal', 'financial', 'health'] as const;
export const impacts = ['low', 'medium', 'high'] as const;
export const taskSchema = z.object({
  name: z.string().trim().min(1).max(200),
  task_type: z.enum(taskTypes),
  monthly_volume: z.number().int().min(0).max(100000000).nullable(),
  minutes_per_task: z.number().min(0).max(999999.99).nullable(),
  error_impact: z.enum(impacts).nullable(),
  data_sensitivity: z.enum(sensitivities).nullable(),
  current_tools: z.array(z.string().trim().min(1).max(100)).max(20),
  extraction_confidence: z.number().min(0).max(1),
  reasoning: z.string().trim().min(1).max(1000),
}).strict();
export const extractionSchema = z.object({
  tasks: z.array(taskSchema).min(1).max(20),
  follow_up_questions: z.array(z.string().trim().min(1).max(500)).max(10),
}).strict();
export const intakeSchema = z.object({
  title: z.string().trim().min(1).max(150),
  sector_id: z.string().min(1).max(80),
  business_summary: z.string().trim().max(2000),
  workflow: z.string().trim().min(30).max(12000),
}).strict();
export type Intake = z.infer<typeof intakeSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Extraction = z.infer<typeof extractionSchema>;
export function readyToConfirm(tasks: Task[]) {
  return extractionSchema.shape.tasks.safeParse(tasks).success && tasks.every(t =>
    t.monthly_volume !== null && t.minutes_per_task !== null &&
    t.error_impact !== null && t.data_sensitivity !== null);
}
