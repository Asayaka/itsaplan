import { Elysia } from 'elysia';
import { localeFromAcceptLanguage } from '@repo/mailer';
import { getProjectAccess, requireUser } from '#shared/access';
import { authContext } from '#shared/auth-context';
import { HttpError } from '#shared/lib';
import { errors } from '#shared/responses';
import {
  backgroundParams,
  PreferencePatch,
  PreferenceResponse,
  uploadBackgroundBody,
} from './model';
import { getPreferences, isValidTimezone, updatePreferences } from './service';
import { readBackground, removeBackground, uploadBackground } from './background';

// The session user's own interface preferences: timezone, language, theme, how a clicked issue
// opens, which section the app root lands on, whether the AI chat starts open, where an
// agent run opens, how an issue's status stats section starts out, whether they are
// subscribed to the issues they touch, and the project they were in last. Every
// route is self-scoped to the session user, so no project guard applies — a user
// only ever reads or writes their own row. Not MCP tools: an agent has no business
// changing a person's UI settings.
export const userPreferenceRoutes = new Elysia({
  name: 'user-preferences',
  detail: { tags: ['Settings'] },
})
  .use(authContext)

  .get(
    '/account/preferences',
    ({ user, request }) =>
      getPreferences(
        requireUser(user).id,
        localeFromAcceptLanguage(request.headers.get('accept-language')),
      ),
    {
      response: { 200: PreferenceResponse, ...errors(401) },
      detail: {
        summary: 'Get account preferences',
        description:
          "Get the current user's interface preferences. Returns browser-localized defaults when none were saved.",
      },
    },
  )

  .patch(
    '/account/preferences',
    async ({ user, body, request }) => {
      const current = requireUser(user);
      if (body.timezone !== undefined && !isValidTimezone(body.timezone)) {
        throw new HttpError(400, 'Unknown timezone');
      }
      if (body.lastProjectId != null && !(await getProjectAccess(body.lastProjectId, current.id))) {
        throw new HttpError(403, 'You do not have access to this project');
      }
      return updatePreferences(
        current.id,
        body,
        localeFromAcceptLanguage(request.headers.get('accept-language')),
      );
    },
    {
      body: PreferencePatch,
      response: { 200: PreferenceResponse, ...errors(400, 401, 403) },
      detail: {
        summary: 'Update account preferences',
        description:
          "Update the current user's interface preferences. Omitted fields keep their current value.",
      },
    },
  )

  .post(
    '/account/background',
    async ({ user, body, request }) => {
      const current = requireUser(user);
      await uploadBackground(current.id, body.file);
      return getPreferences(
        current.id,
        localeFromAcceptLanguage(request.headers.get('accept-language')),
      );
    },
    {
      body: uploadBackgroundBody,
      response: { 200: PreferenceResponse, ...errors(400, 401, 413, 502) },
      detail: { summary: "Upload the current user's background image" },
    },
  )

  .delete(
    '/account/background',
    async ({ user, request }) => {
      const current = requireUser(user);
      await removeBackground(current.id);
      return getPreferences(
        current.id,
        localeFromAcceptLanguage(request.headers.get('accept-language')),
      );
    },
    {
      response: { 200: PreferenceResponse, ...errors(401) },
      detail: { summary: "Remove the current user's background image" },
    },
  )

  .get(
    '/account/background/:id/raw',
    async ({ user, params }) => {
      const current = requireUser(user);
      const object = await readBackground(current.id, params.id);
      const headers: Record<string, string> = {
        'Content-Type': object.contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      };
      if (object.contentLength != null) headers['Content-Length'] = String(object.contentLength);
      return new Response(object.body, { headers });
    },
    {
      params: backgroundParams,
      response: { ...errors(401, 404) },
      detail: { summary: "Read the current user's background image" },
    },
  );
