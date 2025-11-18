// @ts-nocheck
import { getServerSession } from 'next-auth';

import { authOptions } from './auth.js';
import { ensureDefaultProjectForUser, findProjectForUser } from './user-context.js';

export async function requireUserSession() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!userId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  return { session, userId };
}

export async function resolveActiveProject(userId, request) {
  const url = new URL(request.url);
  const requestedProjectId = Number(url.searchParams.get('projectId'));

  if (requestedProjectId) {
    const project = await findProjectForUser(userId, requestedProjectId);
    if (project) {
      return project;
    }
  }

  const { project } = await ensureDefaultProjectForUser(userId);
  if (!project) {
    throw Object.assign(new Error('Active project not found'), { status: 404 });
  }
  return project;
}

export async function getRuntimeContext(request) {
  const { userId, session } = await requireUserSession();
  const project = await resolveActiveProject(userId, request);
  return { session, userId, project, projectId: project?.id };
}
