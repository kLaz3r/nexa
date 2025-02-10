import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import FollowButton from "~/components/FollowButton";
import { Textarea } from "~/components/ui/textarea";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export default async function UserProfile({
  params,
}: {
  params: Promise<string>;
}) {
  const slug = await params;
  const userIdSlug = slug["user-id"] as string;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userIdSlug),
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
  console.log(user);

  if (!user) {
    notFound();
  }

  const formattedDate = new Date(user.createdAt).toLocaleDateString();

  // Fetch follower details limited to 5 iterations
  const limitedFollowedBy = user.followedBy.slice(0, 5);
  const followerDetails = await Promise.all(
    limitedFollowedBy.map(async (follow) => {
      return await db.query.users.findFirst({
        where: eq(users.id, follow.followerId),
      });
    }),
  );

  // Fetch following details limited to 5 iterations
  const limitedFollowing = user.following.slice(0, 5);
  const followingDetails = await Promise.all(
    limitedFollowing.map(async (follow) => {
      return await db.query.users.findFirst({
        where: eq(users.id, follow.followingId),
      });
    }),
  );

  return (
    <main className="flex min-h-screen min-w-80 flex-col items-center p-4">
      <div className="my-6 flex items-center gap-4 md:gap-6">
        <div className="relative h-28 w-28 md:h-48 md:w-48">
          <Image
            src={user.avatar ?? null}
            alt="avatar"
            fill
            className="rounded-full"
          />
        </div>
        <div className="flex flex-col items-start justify-start gap-2">
          <h1 className="text-4xl font-semibold md:text-6xl">
            {user.username}
          </h1>
          <h3 className="text-lg font-normal md:text-2xl">{user.location}</h3>
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-normal">
              Urmaritori{" "}
              <span className="font-semibold text-primary">
                {user.followedBy.length}
              </span>
            </h3>
            <h3 className="text-lg font-normal">
              Urmariti{" "}
              <span className="font-semibold text-primary">
                {user.following.length}
              </span>
            </h3>
          </div>
          <FollowButton
            followingId={user.id}
            className="mt-2 rounded-md bg-gradient-to-r from-primary to-secondary px-6 py-2 text-lg font-semibold text-white transition-transform hover:scale-105"
          >
            Urmărește
          </FollowButton>
        </div>
      </div>
      {/* <FollowersFollwingTable userId={user.id} /> */}
      <div className="flex w-full max-w-96 flex-col items-start justify-start gap-2">
        <h1 className="text-2xl font-semibold">Bio</h1>
        <div className="relative w-full">
          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary to-secondary"></div>
          <Textarea
            className="relative m-[1px] min-h-32 w-[calc(100%-2px)] bg-background"
            value={user.bio === "" ? "Utilizatorul nu are biografie" : user.bio}
            readOnly
          />
        </div>
      </div>
      <div className="mt-9 flex w-full max-w-96 flex-row items-start justify-between gap-4">
        <div className="flex flex-col items-start justify-start gap-2">
          <h1 className="text-2xl font-semibold">Urmaritori</h1>
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            {followerDetails.map(
              (follower) =>
                follower && (
                  <div key={follower.id} className="flex items-center gap-2">
                    <Image
                      className="rounded-full"
                      src={follower.avatar || "/default-avatar.png"}
                      alt={`${follower.username}'s avatar`}
                      width={40}
                      height={40}
                    />
                    <h2 className="text-xl font-medium">{follower.username}</h2>
                  </div>
                ),
            )}
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-2">
          <h1 className="text-2xl font-semibold">Urmariti</h1>
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            {followingDetails.map(
              (following) =>
                following && (
                  <div key={following.id} className="flex items-center gap-2">
                    <Image
                      className="rounded-full"
                      src={following.avatar || "/default-avatar.png"}
                      alt={`${following.username}'s avatar`}
                      width={40}
                      height={40}
                    />
                    <h2 className="text-xl font-medium">
                      {following.username}
                    </h2>
                  </div>
                ),
            )}
          </div>
        </div>
      </div>
      <div className="flex w-full max-w-[650px] flex-col items-center gap-4 rounded-lg bg-background p-6 shadow-post">
        <h1 className="text-2xl font-bold">User Profile</h1>
        <p>User ID: {userIdSlug}</p>
        <div className="flex w-full flex-col items-center gap-4">
          {user.avatar && (
            <Image
              src={user.avatar}
              alt={`${user.username}'s avatar`}
              width={100}
              height={100}
            />
          )}
          <h2 className="text-xl font-bold">{user.username}</h2>
          <p>{user.bio}</p>
          <p>Location: {user.location}</p>
          <p>Joined: {formattedDate}</p>
          <p>Email: {user.email}</p>
        </div>
      </div>
    </main>
  );
}
