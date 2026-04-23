import React from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function SettingsPanel() {
  const { settings, updateSettings, setShowSettings } = useAppStore();

  function handle(key: keyof typeof settings, value: string) {
    const n = parseInt(value, 10);
    if (n > 0) updateSettings({ [key]: n });
  }

  return (
    <div className="absolute inset-0 bg-slate-900/97 backdrop-blur-sm flex flex-col z-40 no-drag">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">Settings</span>
        <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-300"><X size={13} /></button>
      </div>
      <div className="flex-1 px-4 py-3 flex flex-col gap-3 overflow-y-auto">
        <Field label="Focus (min)" value={settings.focusMinutes} onChange={v => handle('focusMinutes', v)} />
        <Field label="Short break (min)" value={settings.shortBreakMinutes} onChange={v => handle('shortBreakMinutes', v)} />
        <Field label="Long break (min)" value={settings.longBreakMinutes} onChange={v => handle('longBreakMinutes', v)} />
        <Field label="Long break every" value={settings.longBreakInterval} onChange={v => handle('longBreakInterval', v)} suffix="sessions" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: string) => void; suffix?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-xs text-slate-400">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          min={1}
          max={120}
          onChange={e => onChange(e.target.value)}
          className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 text-center no-drag"
        />
        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}
