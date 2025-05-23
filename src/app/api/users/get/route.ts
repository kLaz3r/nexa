import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export async function POST(request: Request) {
  try {
    // Get userId from URL parameters
    const { userId } = (await request.json()) as { userId: string };
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Query the database for the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        posts: true,
        comments: true,
        likes: true,
        receivedNotifications: true,
        createdNotifications: true,
        followedBy: true,
        following: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return response with caching headers
    // Cache for 1 hour on CDN and browser
    return new NextResponse(JSON.stringify(user), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
