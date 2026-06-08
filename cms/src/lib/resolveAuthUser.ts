export async function resolveAuthUser(ctx: { state: { user?: { id: number } }; request: { header: { authorization?: string } } }) {
  if (ctx.state.user?.id) {
    return ctx.state.user;
  }

  const header = ctx.request.header.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice(7);
  try {
    const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token) as { id: number };
    if (!payload?.id) return null;
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: payload.id },
    });
    return user ?? null;
  } catch {
    return null;
  }
}
