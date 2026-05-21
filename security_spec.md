# Security Specification - Nuclear Bunker Forum

## 1. Data Invariants
- **Users**:
  - `uid` must match the document ID.
  - `email` must match the auth email.
  - `rank` can only be set initially (defaults to SURVIVOR) and not modified by the user later.
- **Posts**:
  - `authorId` must match the authenticated user's UID.
  - `likes` can only be incremented by 1 at a time.
  - `commentsCount` is managed by system logic (triggered by comment creation).
- **Comments**:
  - `authorId` must match the authenticated user's UID.

## 2. The "Dirty Dozen" Payloads (PERMISSION_DENIED expected)
1. **User Spoofing**: Update another user's profile.
2. **Rank Escalation**: Register with `rank: "ADMIN"`.
3. **Rank Modification**: Update own profile to `rank: "DEV"`.
4. **Post Identity Theft**: Create a post with someone else's `authorId`.
5. **Like Inflation**: Update a post's `likes` to 999999.
6. **Pinned Highjacking**: Update own post to `isPinned: true`.
7. **Comment Identity Theft**: Comment as another user.
8. **Comment Length Exploit**: Post a 10MB string as a comment.
9. **Post Content Poisoning**: Update someone else's post content.
10. **Staff Reply Fake**: Create a post with `hasStaffReply: true`.
11. **User Deletion**: Attempt to delete the `users` collection.
12. **Unauthenticated Write**: Create a post without being logged in.

## 3. Test Runner (Draft)
The `firestore.rules.test.ts` would verify these scenarios using the Firebase Emulators or similar testing logic.
