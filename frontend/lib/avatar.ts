// lib/avatar.ts
export const getAvatarUrl = (name: string, size: number = 80): string => {
  const encodedName = encodeURIComponent(name || "User");
  return `https://ui-avatars.com/api/?name=${encodedName}&background=ec4899&color=fff&size=${size}&font-size=0.5&bold=true&length=2`;
};
