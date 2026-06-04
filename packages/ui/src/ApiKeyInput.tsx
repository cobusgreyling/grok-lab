'use client';
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function ApiKeyInput({ value, onChange, label = 'xAI API KEY (optional for demo)', placeholder = 'xai-...', className = '' }: Props) {
  return (
    <div className={`grok-card p-5 mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center ${className}`}>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-widest text-[#a1a1aa] mb-1.5">{label}</div>
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#111] border border-[#262626] rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#f97316] placeholder:text-[#52525b]"
        />
        <div className="text-[10px] text-[#52525b] mt-1">Stored only in your browser for these demos. For public deploys use a server proxy (/api).</div>
      </div>
      <div className="flex items-center gap-3 pt-2 md:pt-6">
        <a href="https://console.x.ai" target="_blank" className="text-xs text-[#f97316] flex items-center gap-1 hover:underline">
          Get key <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
