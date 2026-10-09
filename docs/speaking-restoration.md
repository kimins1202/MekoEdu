# Speaking restoration

RecordRTC stores metadata in AsyncStorage under `speaking:v1:<userid>:<attemptId>:<encoded fieldName>`; audio stays in Documents through Expo Audio SDK 57's `directory: "document"`. No audio bytes or tokens are stored in this metadata. Files must exist and contain bytes before local playback/upload.

Each page mount or screen focus fetches the current attempt page independently of the exam page cache. Simultaneous requests share a promise. The matching slot and parsed recording field must both match. Only `recording`/`response_recording` response areas and HTTP(S) m4a/mp3/ogg files qualify. Prompt audio is excluded. A pending replacement overrides the old Moodle response. An uploaded flag alone never establishes server restoration. Moodle playback uses the existing URL/token utility.

Speaking saves use a fresh Moodle sequencecheck. Generic autosave and final submission omit recording draft IDs and their stale sequences; Speaking is saved through its dedicated upload/save flow. Pending replacements block submission before answers are frozen, with an additional guard in background sync. Upload failure retains the local recording. No old Moodle file is deleted.

## Verification performed

- `npx.cmd tsc --noEmit`: passed. The `.cmd` launcher avoids this Windows environment's PowerShell script restriction.
- `node --test scripts/test-speaking-storage.cjs scripts/test-offline-sync.cjs scripts/test-question-answer-status.cjs scripts/test-resume-exam.cjs`: 27 passed.
- `git diff --check`: passed.

These are mocked service/payload tests, not native audio or live Moodle integration tests. No live responsefileareas fixture was found in the repository. Its actual area names, file URLs, authentication and native playback still require server/device verification.

## iPhone and Moodle Web checklist

1. Open a fresh attempt with two Speaking slots: both start empty. Record distinct answers in each. Stop, listen, switch pages and return; each slot must retain its own recording.
2. Close and reopen the app after stopping an unuploaded recording. Resume the same attempt, listen and upload. On Moodle Web verify the matching question plays that recording.
3. After upload, switch pages and reopen the attempt. Verify Moodle playback. In a development build, remove only that recording's local file and repeat; playback must still work from Moodle.
4. Disable networking: cached pages and other answers must remain usable. An unuploaded local recording must play and survive failed upload. Restore networking, reopen the question and upload successfully.
5. Record a replacement. Before upload, try submission: it must warn without freezing the attempt. Make upload fail, reopen and confirm the replacement survives. Upload it, then submit; Moodle Web must contain the replacement and the other answers.
6. Use another attempt/account and verify no recording from the previous context appears. Check m4a/mp3/ogg response files, missing/empty local files and absent/invalid Moodle URLs.
7. Check finished/expired/submitting states: recording and upload must be locked, playback remains available. Check permission rejection, maximum duration, navigating during recording/upload, and playback pause/resume.

## Remaining limits

- If time expires with a pending replacement, submission is blocked to avoid silently submitting the old recording. Upload is also locked by expiry; the file remains on the device. Resolving that case requires an explicit exam policy.
- Killing the app while recording, before stop/persistence completes, cannot guarantee a recoverable recording.
- A lost Moodle save response or failed metadata write can leave a locally pending record although Moodle received it. No automatic reupload occurs; a manual retry may create another draft upload. There is no server-side idempotency guarantee.
- Persistent recordings are retained; no automatic deletion policy is introduced.
