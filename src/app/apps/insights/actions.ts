"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hqBase } from "@/lib/hq";
import { requireAdmin, signIn, signOut } from "@/lib/hq-admin";
import { compileContext } from "@/lib/insights/compile";
import { createDraft, deleteInsight, setStatus, updateInsight } from "@/lib/insights/store";
import { DIRECTIONS, LANGUAGES, topicBySlug, type Direction, type Language } from "@/lib/insights/topics";
import { INSIGHT_MODEL, writeInsight } from "@/lib/insights/write";

/**
 * Insight actions. Each one checks the admin cookie itself: the forms only
 * show when signed in, but a request can be sent without the form.
 */

export type ActionState = { error: string | null };

const text = (form: FormData, name: string) => {
  const v = form.get(name);
  return typeof v === "string" ? v : "";
};

export async function signInAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const ok = await signIn(text(form, "key"));
  if (!ok) {
    // A little friction against guessing.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "That key is not right." };
  }
  revalidatePath("/apps/insights");
  return { error: null };
}

export async function signOutAction(): Promise<void> {
  await signOut();
  revalidatePath("/apps/insights");
}

export async function generateAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const topic = topicBySlug(text(form, "topic"));
  const direction = text(form, "direction") as Direction;
  const language = text(form, "language") as Language;
  const notes = text(form, "notes").trim().slice(0, 1000) || null;
  if (!topic) return { error: "Pick a topic." };
  if (!DIRECTIONS.includes(direction)) return { error: "Pick your call: up, down or sideways." };
  if (!(language in LANGUAGES)) return { error: "Pick a language." };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "ANTHROPIC_API_KEY is not set here, so the writer cannot run. Add it to .env.local." };

  let id: string;
  try {
    const context = await compileContext(topic, { direction, notes });
    const article = await writeInsight(context, language, apiKey);
    if (!article) return { error: "The writer's answer was not usable. Try again." };
    id = await createDraft({
      topic: topic.slug,
      direction,
      language,
      notes,
      title: article.title,
      body: article.body,
      context,
      model: INSIGHT_MODEL,
    });
  } catch (error) {
    console.error("insights: could not write", error);
    return { error: "Could not write the insight just now. Try again in a minute." };
  }
  revalidatePath("/apps/insights");
  redirect(`${await hqBase()}/insights/${id}`);
}

export async function saveAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = text(form, "id");
  const title = text(form, "title").trim().slice(0, 140);
  const summary = text(form, "summary").trim().slice(0, 600);
  const sections: { heading: string; text: string }[] = [];
  for (let i = 0; i < 12; i += 1) {
    const heading = text(form, `heading_${i}`).trim().slice(0, 80);
    const body = text(form, `text_${i}`).trim().slice(0, 2000);
    if (heading && body) sections.push({ heading, text: body });
  }
  if (!title || !summary || sections.length === 0) return { error: "Title, summary and at least one section are needed." };
  try {
    await updateInsight(id, { title, body: { summary, sections } });
  } catch (error) {
    console.error("insights: could not save", error);
    return { error: "Could not save. Try again." };
  }
  revalidatePath("/apps/insights");
  revalidatePath(`/apps/insights/${id}`);
  return { error: null };
}

export async function publishAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = text(form, "id");
  await setStatus(id, text(form, "status") === "published" ? "published" : "draft");
  revalidatePath("/apps/insights");
  revalidatePath(`/apps/insights/${id}`);
}

export async function deleteAction(form: FormData): Promise<void> {
  await requireAdmin();
  await deleteInsight(text(form, "id"));
  revalidatePath("/apps/insights");
  redirect(`${await hqBase()}/insights`);
}
