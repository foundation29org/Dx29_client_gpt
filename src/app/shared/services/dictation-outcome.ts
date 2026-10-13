// What a dictation ends up with once every segment has been transcribed, or has failed.
//
// A long recording is several segments, each sent on its own. A segment that fails for good
// (Azure down, network cut) must not throw away the minutes that were transcribed fine: the
// user gets that text and is told a part is missing, so the missing part can be dictated again.

/** A segment, settled: it either produced text (maybe empty: silence) or failed. */
export type SegmentResult = { status: 'fulfilled'; value: string } | { status: 'rejected'; reason: unknown };

/** The dictation as the user receives it. `incomplete` means some part was lost on the way. */
export interface DictationResult {
  text: string;
  incomplete: boolean;
}

export type DictationOutcome =
  | ({ kind: 'text' } & DictationResult)
  /** Nothing was transcribed and a segment was lost: the first failure explains it. */
  | { kind: 'failed'; reason: unknown }
  /** Nothing was transcribed and the only failures were recordings the Server cannot decode. */
  | { kind: 'unreadable' }
  /** Every segment came back empty: nobody spoke. */
  | { kind: 'silence' };

// The Server answered 400: it could not decode the recording (typically a few seconds at the end).
// Sending it again would not change that, and it must not make the whole dictation fail.
const UNREADABLE_CODE = 'unreadable-audio';

const isUnreadable = (reason: unknown): boolean => (reason as { code?: unknown } | null)?.code === UNREADABLE_CODE;

/** Never rejects: lets every segment finish, so one failure does not hide the others. */
export function settleSegment(transcription: Promise<string>): Promise<SegmentResult> {
  return transcription.then(
    (value): SegmentResult => ({ status: 'fulfilled', value }),
    (reason): SegmentResult => ({ status: 'rejected', reason })
  );
}

/** Segments in recording order. */
export function settleDictation(results: SegmentResult[]): DictationOutcome {
  const texts: string[] = [];
  const lost: unknown[] = [];
  let unreadable = false;
  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value) texts.push(result.value);
    } else if (isUnreadable(result.reason)) {
      unreadable = true;
    } else {
      lost.push(result.reason);
    }
  }

  const text = texts.join(' ').trim();
  if (text) return { kind: 'text', text, incomplete: lost.length > 0 };
  if (lost.length > 0) return { kind: 'failed', reason: lost[0] };
  return unreadable ? { kind: 'unreadable' } : { kind: 'silence' };
}
