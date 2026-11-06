import { getSupabaseClient } from '../lib/supabase';

export async function createGoogleMeet(title: string, durationMinutes = 60) {
  const client = getSupabaseClient();
  const { data } = (await client?.auth.getSession()) || { data: { session: null } };
  const providerToken = data.session?.provider_token;
  if (!providerToken) throw new Error('يلزم تسجيل الدخول بواسطة Google والموافقة على صلاحية إنشاء الاجتماع.');

  const start = new Date();
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const requestId = `duha-${Date.now()}-${crypto.randomUUID()}`;
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    headers: { Authorization: `Bearer ${providerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: title,
      description: 'بث مباشر أُنشئ من منصة نحن معك',
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Baghdad' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Baghdad' },
      conferenceData: { createRequest: { requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    }),
  });
  const event = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('انتهت صلاحية Google. أعد تسجيل الدخول بواسطة Google ثم حاول مجددًا.');
    throw new Error('تعذر إنشاء رابط Google Meet حاليًا.');
  }
  const meetingUrl = event.hangoutLink || event.conferenceData?.entryPoints?.find((item: any) => item.entryPointType === 'video')?.uri;
  if (!meetingUrl) throw new Error('أنشأ Google الموعد دون رابط Meet. حاول مرة أخرى.');
  return { meetingUrl: String(meetingUrl), eventId: String(event.id || ''), endsAt: end.getTime() };
}
