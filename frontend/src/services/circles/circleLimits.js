export const MAX_CIRCLE_MEMBERS = 6;
export const MAX_PRIVATE_CIRCLES_PER_CREATOR = 4;

export const getCircleMemberCount = (circle) => {
  const byCount = Number(circle?.memberCount ?? circle?.membersCount ?? NaN);
  if (Number.isFinite(byCount)) return byCount;
  if (Array.isArray(circle?.members)) return circle.members.length;
  return 0;
};

