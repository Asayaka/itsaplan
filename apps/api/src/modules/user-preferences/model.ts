import { t } from 'elysia';
import { LOCALES } from '@repo/mailer';
import { HotkeyCombosSchema } from '#modules/settings/model';
import { PALETTES } from './service';

// t.UnionEnum defaults to its first value, which would reset the language on a patch that
// leaves it out.
const Locale = t.UnionEnum([...LOCALES], { default: undefined });
const Theme = t.Union([t.Literal('light'), t.Literal('dark'), t.Literal('system')]);
const Palette = t.UnionEnum([...PALETTES], { default: undefined });
// Lowercase only: the web app puts the colors in a cookie the server reads as written.
const Hex = t.String({ pattern: '^#[0-9a-f]{6}$' });
const CustomTheme = t.Object({
  accent: Hex,
  background: Hex,
  contrast: t.Integer({ minimum: 0, maximum: 100 }),
});
const IssueOpenMode = t.Union([t.Literal('panel'), t.Literal('page')]);
const StartPage = t.Union([
  t.Literal('inbox'),
  t.Literal('dashboard'),
  t.Literal('work-items'),
  t.Literal('initiatives'),
]);
const AgentRunsView = t.Union([t.Literal('full'), t.Literal('compact')]);
const IssueStatsView = t.Union([t.Literal('compact'), t.Literal('timeline')]);
const IssueActivityView = t.Union([t.Literal('flat'), t.Literal('grouped')]);

export const PreferenceResponse = t.Object({
  timezone: t.String(),
  locale: Locale,
  theme: Theme,
  palette: Palette,
  customTheme: t.Nullable(CustomTheme),
  issueOpenMode: IssueOpenMode,
  startPage: StartPage,
  showChatByDefault: t.Boolean(),
  agentRunsView: AgentRunsView,
  issueStatsOpen: t.Boolean(),
  issueStatsView: IssueStatsView,
  issueActivityView: IssueActivityView,
  autoWatch: t.Boolean(),
  onboardingSeen: t.Boolean(),
  showcaseSeen: t.Boolean(),
  unsentCommentNoticeHidden: t.Boolean(),
  backgroundImage: t.Nullable(t.String()),
  backgroundEnabled: t.Boolean(),
  backgroundOpacity: t.Integer({ minimum: 0, maximum: 40 }),
  lastProjectId: t.Nullable(t.Number()),
  hotkeys: HotkeyCombosSchema,
});

export const PreferencePatch = t.Object({
  timezone: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
  locale: t.Optional(Locale),
  theme: t.Optional(Theme),
  palette: t.Optional(Palette),
  customTheme: t.Optional(t.Nullable(CustomTheme)),
  issueOpenMode: t.Optional(IssueOpenMode),
  startPage: t.Optional(StartPage),
  showChatByDefault: t.Optional(t.Boolean()),
  agentRunsView: t.Optional(AgentRunsView),
  issueStatsOpen: t.Optional(t.Boolean()),
  issueStatsView: t.Optional(IssueStatsView),
  issueActivityView: t.Optional(IssueActivityView),
  autoWatch: t.Optional(t.Boolean()),
  onboardingSeen: t.Optional(t.Boolean()),
  showcaseSeen: t.Optional(t.Boolean()),
  unsentCommentNoticeHidden: t.Optional(t.Boolean()),
  backgroundEnabled: t.Optional(t.Boolean()),
  backgroundOpacity: t.Optional(t.Integer({ minimum: 0, maximum: 40 })),
  lastProjectId: t.Optional(t.Nullable(t.Number())),
  hotkeys: t.Optional(HotkeyCombosSchema),
});

export const backgroundParams = t.Object({
  id: t.String({
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
  }),
});

export const uploadBackgroundBody = t.Object({ file: t.File() });
