import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function VoiceMessage({
  onSend,
  disabled,
}: {
  onSend: (payload: { voiceUrl: string; duration: number }) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<number | null>(null);

  const supported = useMemo(() => typeof window !== "undefined" && !!(navigator.mediaDevices?.getUserMedia), []);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const start = async () => {
    if (!supported || disabled) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    setSeconds(0);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => {
        const voiceUrl = String(reader.result || "");
        if (voiceUrl) onSend({ voiceUrl, duration: seconds });
      };
      reader.readAsDataURL(blob);
    };

    recorder.start();
    setRecording(true);
    tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stop = () => {
    if (!recording) return;
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRecording(false);
    mediaRecorderRef.current?.stop();
  };

  if (!supported) return null;

  return (
    <Button type="button" variant={recording ? "destructive" : "outline"} onClick={recording ? stop : start} disabled={disabled}>
      {recording ? `Stop (${seconds}s)` : "Voice"}
    </Button>
  );
}
