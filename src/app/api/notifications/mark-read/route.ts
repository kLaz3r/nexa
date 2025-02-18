import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";

export async function POST(request: Request) {
  try {
    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to mark notification as read" }),
      {
        status: 500,
      },
    );
  }
}
